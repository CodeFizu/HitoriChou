// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, Timestamp, deleteDoc, addDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js"; // ✅ import from hidden config

// Firebase initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const transactionForm = document.getElementById("transactionForm");
const categorySelect = document.getElementById("category");
const typeSelect = document.getElementById("type");
const yearSelect = document.getElementById("year");
const monthSelect = document.getElementById("month");
const transactionTable = document.getElementById("transactionTable").getElementsByTagName("tbody")[0];

// Totals DOM elements (Income, Expense, Savings)
const totalIncomeElement = document.getElementById("totalIncome");
const totalExpenseElement = document.getElementById("totalExpense");
const totalSavingsElement = document.getElementById("totalSavings");


// Categories for income and expense
const expenseCategories = ["家賃", "公共料金", "通信費", "交通費", "買い物", "その他"];
const incomeCategories = ["給料", "投資", "お小遣い", "その他"];

// Function to update the category dropdown based on selected type (Income or Expense)
function updateCategoryOptions() {
  const selectedType = typeSelect.value;

  // Clear current options
  categorySelect.innerHTML = "";

  let categoriesToShow = [];
  
  // Show categories based on selected type
  if (selectedType === "Income") {
    categoriesToShow = incomeCategories;
  } else if (selectedType === "Expense") {
    categoriesToShow = expenseCategories;
  }

  // Add categories to the dropdown
  categoriesToShow.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Call this function when the page loads to initialize the category options based on the default type
updateCategoryOptions();

// Listen for changes in the type dropdown (Income/Expense) to update categories dynamically
typeSelect.addEventListener("change", updateCategoryOptions);


// Global variables
let user = null;
let totalSavings = 0; // To store total savings

// Fetch all user transactions (for total savings)
async function fetchAllUserTransactions(userId) {
  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

// Fetch user transactions for a specific year and month
async function fetchUserTransactions(userId, year, month) {
  const transactionsRef = collection(db, "transactions");
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const q = query(transactionsRef, where("userId", "==", userId), where("date", ">=", Timestamp.fromDate(startDate)), where("date", "<=", Timestamp.fromDate(endDate)));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

// Add a transaction to the database
async function addTransaction(transactionData) {
  try {
    const transactionRef = await addDoc(collection(db, "transactions"), transactionData);
    console.log("Transaction added with ID:", transactionRef.id);
    updateDataForFilter(); // Refresh the data to show the new transaction

    // Recalculate and update savings
    const allTransactions = await fetchAllUserTransactions(user.uid);
    totalSavings = calculateTotalSavings(allTransactions);
    updateTotalSavings(); // Update savings display
  } catch (error) {
    console.error("Error adding transaction:", error);
  }
}


// Delete a transaction from the database
async function deleteTransaction(transactionId) {
  try {
    // Ensure correct document reference
    const transactionDocRef = doc(db, "transactions", transactionId);
    await deleteDoc(transactionDocRef);
    console.log("Transaction deleted");
    updateDataForFilter(); // Refresh the data to remove the deleted transaction

    // Recalculate and update savings
    const allTransactions = await fetchAllUserTransactions(user.uid);
    totalSavings = calculateTotalSavings(allTransactions);
    updateTotalSavings(); // Update savings display
  } catch (error) {
    console.error("Error deleting transaction:", error);
  }
}


// Update data (totals and transactions table) when filters are changed
async function updateDataForFilter() {
  const selectedYear = yearSelect.value;
  const selectedMonth = monthSelect.value;

  if (user) {
    const userId = user.uid;
    const transactions = await fetchUserTransactions(userId, selectedYear, selectedMonth);
    updateTotals(transactions); // This updates only income and expense totals
    updateTransactionTable(transactions); // Update the transactions table
  }
}

// Update totals (Income, Expense) but do not update savings (savings is fixed)
function updateTotals(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((transaction) => {
    const amount = transaction.amount;
    if (transaction.type === "Income") totalIncome += amount;
    else if (transaction.type === "Expense") totalExpense += amount;
  });

  totalIncomeElement.textContent = formatCurrency(totalIncome);
  totalExpenseElement.textContent = formatCurrency(totalExpense);
  totalSavingsElement.textContent = formatCurrency(totalSavings);
}


// Function to format currency (Yen)
function formatCurrency(value) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(value);
}

// Update the transactions table
function updateTransactionTable(transactions) {
  transactionTable.innerHTML = ""; // Clear existing rows

  if (transactions.length === 0) {
    const newRow = transactionTable.insertRow();
    newRow.innerHTML = "<td colspan='6'>取引がありません。</td>"; // No transactions found
  } else {
    transactions.forEach((transaction) => {
      const newRow = transactionTable.insertRow();
      newRow.innerHTML = `
        <td>${transaction.date.toDate().toLocaleDateString("ja-JP")}</td>
        <td>${transaction.type === "Income" ? "収入" : "支出"}</td>
        <td>${transaction.category}</td>
        <td>${transaction.description}</td>
        <td>¥${transaction.amount}</td>
        <td><button class="delete-btn" data-id="${transaction.id}">削除</button></td>
      `;
      newRow.querySelector(".delete-btn").addEventListener("click", () => deleteTransaction(transaction.id));
    });
  }
}

// Monitor authentication state change
onAuthStateChanged(auth, async (authenticatedUser) => {
  if (authenticatedUser) {
    user = authenticatedUser;

    const currentYear = new Date().getFullYear();
    const startYear = 2015;
    const endYear = currentYear;

    // Populate year dropdown
    for (let year = startYear; year <= endYear; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = `${year}年`;
      yearSelect.appendChild(option);
    }

    // Set default year and month
    yearSelect.value = currentYear;
    monthSelect.value = new Date().getMonth() + 1;

    // Initial data load
    updateDataForFilter();

    // Calculate and set total savings (not affected by the filter)
    const userId = user.uid;
    const allTransactions = await fetchAllUserTransactions(userId);
    totalSavings = calculateTotalSavings(allTransactions);
    updateTotalSavings();
  } else {
    console.log("No user logged in");
  }
});

// Function to calculate total savings (for all transactions, not filtered)
function calculateTotalSavings(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((transaction) => {
    const amount = transaction.amount;
    if (transaction.type === "Income") totalIncome += amount;
    else if (transaction.type === "Expense") totalExpense += amount;
  });

  return totalIncome - totalExpense;
}

// Function to update total savings on the page
function updateTotalSavings() {
  totalSavingsElement.textContent = formatCurrency(Math.max(totalSavings, 0)); // Keep savings non-negative
}

// Event listeners for year and month filters
yearSelect.addEventListener("change", updateDataForFilter);
monthSelect.addEventListener("change", updateDataForFilter);

// Form submission to add a new transaction
transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const category = categorySelect.value;
  const type = typeSelect.value;
  const description = document.getElementById("description").value;
  const amount = parseInt(document.getElementById("amount").value);
  const date = new Date(document.getElementById("date").value);

  if (amount && description) {
    const transactionData = {
      userId: user.uid,
      category,
      type,
      description,
      amount,
      date: Timestamp.fromDate(date),
    };

    addTransaction(transactionData); // Add the transaction to Firestore
    transactionForm.reset(); // Clear the form fields after submission
  } else {
    alert("金額と説明を入力してください");
  }
});

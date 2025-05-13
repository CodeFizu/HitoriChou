// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js"; // ✅ import from hidden config

// Firebase initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const totalIncomeElement = document.getElementById("totalIncome");
const totalExpenseElement = document.getElementById("totalExpense");
const totalSavingsElement = document.getElementById("totalSavings");
const yearSelect = document.getElementById("year");
const monthSelect = document.getElementById("month");

// Data arrays for charts
const expenseCategories = ["家賃", "公共料金", "通信費", "交通費", "買い物", "その他"];
const incomeCategories = ["給料", "投資", "お小遣い", "その他"];

// Global variables
let user = null;
let expenseChartInstance = null;
let incomeChartInstance = null;
let totalSavings = 0; // To store the total savings across all months

// Function to format currency (Yen)
function formatCurrency(value) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(value);
}

// Fetch all user transactions (for total savings)
async function fetchAllUserTransactions(userId) {
  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Fetch user transactions for a specific year and month
async function fetchUserTransactions(userId, year, month) {
  const transactionsRef = collection(db, "transactions");
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const q = query(transactionsRef, where("userId", "==", userId), where("date", ">=", Timestamp.fromDate(startDate)), where("date", "<=", Timestamp.fromDate(endDate)));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Update data (totals and charts) when filters are changed
async function updateDataForFilter() {
  const selectedYear = yearSelect.value;
  const selectedMonth = monthSelect.value;

  if (user) {
    const userId = user.uid;
    const transactions = await fetchUserTransactions(userId, selectedYear, selectedMonth);
    updateTotals(transactions); // This updates only income and expense
    prepareChartData(transactions);
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
  // Do not update total savings here (total savings remains fixed)
}

// Prepare chart data for income and expense categories
function prepareChartData(transactions) {
  let expenseData = new Array(expenseCategories.length).fill(0);
  let incomeData = new Array(incomeCategories.length).fill(0);

  transactions.forEach((transaction) => {
    const amount = transaction.amount;
    const category = transaction.category;
    if (transaction.type === "Expense") {
      const index = expenseCategories.indexOf(category);
      if (index !== -1) expenseData[index] += amount;
    } else if (transaction.type === "Income") {
      const index = incomeCategories.indexOf(category);
      if (index !== -1) incomeData[index] += amount;
    }
  });

  updateCharts(expenseData, incomeData);
}

// Update charts (Expense and Income)
function updateCharts(expenseData, incomeData) {
  if (expenseChartInstance) expenseChartInstance.destroy();
  if (incomeChartInstance) incomeChartInstance.destroy();

  expenseChartInstance = new Chart(document.getElementById("expenseChart").getContext("2d"), {
    type: "doughnut",
    data: {
      labels: expenseCategories,
      datasets: [{ data: expenseData, backgroundColor: ["#B71C1C", "#C62828", "#D32F2F", "#E57373", "#EF9A9A", "#FFCDD2"], borderColor: "#fff", borderWidth: 1 }],
    },
  });

  incomeChartInstance = new Chart(document.getElementById("incomeChart").getContext("2d"), {
    type: "doughnut",
    data: {
      labels: incomeCategories,
      datasets: [{ data: incomeData, backgroundColor: ["#388E3C", "#43A047", "#66BB6A", "#81C784"], borderColor: "#fff", borderWidth: 1 }],
    },
  });
}

// Event listeners for year and month filters
yearSelect.addEventListener("change", updateDataForFilter);
monthSelect.addEventListener("change", updateDataForFilter);

// Firebase Auth state change (user login)
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

    // Initial data load (filtered view)
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

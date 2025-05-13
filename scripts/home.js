// Import Firebase Auth, Firestore, and Firebase App SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js"; // ✅ import from hidden config

// Firebase initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements for displaying data
const totalIncomeElement = document.getElementById('totalIncome');
const totalExpenseElement = document.getElementById('totalExpense');
const totalSavingsElement = document.getElementById('totalSavings');

// Data arrays for charts
const incomeCategories = ["給料", "投資", "お小遣い", "その他"];
const expenseCategories = ["家賃", "公共料金", "通信費", "交通費", "買い物", "その他"];

// Function to format the numbers for yen (no decimals, with commas)
function formatCurrency(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Fetch user transactions for the current month (for income and expenses)
async function fetchUserTransactionsForCurrentMonth(userId) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // months are 0-indexed

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // end of the month

  const transactionsRef = collection(db, "transactions");
  const q = query(
    transactionsRef,
    where("userId", "==", userId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate))
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Fetch all user transactions for savings calculation
async function fetchAllUserTransactions(userId) {
  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

// Update totals (Income, Expense, Savings)
async function updateTotals(monthlyTransactions, allTransactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  // Calculate total income for the current month
  monthlyTransactions.forEach((transaction) => {
    if (transaction.type === "Income") totalIncome += transaction.amount;
  });

  // Calculate total expense for the current month
  monthlyTransactions.forEach((transaction) => {
    if (transaction.type === "Expense") totalExpense += transaction.amount;
  });

  // Calculate total savings for all time (not restricted by month)
  let totalAllIncome = 0;
  let totalAllExpense = 0;
  allTransactions.forEach((transaction) => {
    const amount = transaction.amount;
    if (transaction.type === "Income") totalAllIncome += amount;
    else if (transaction.type === "Expense") totalAllExpense += amount;
  });

  const totalSavings = totalAllIncome - totalAllExpense;

  // Update the DOM elements for current month totals
  totalIncomeElement.textContent = formatCurrency(totalIncome);
  totalExpenseElement.textContent = formatCurrency(totalExpense);
  
  // Update savings with all-time total savings
  totalSavingsElement.textContent = formatCurrency(totalSavings < 0 ? 0 : totalSavings);
  totalSavingsElement.classList.toggle("savings-negative", totalSavings < 0);
}

// Update charts for income and expense breakdown
function updateCharts(expenseData, incomeData) {
  const expenseChart = new Chart(document.getElementById('expenseChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: expenseCategories,
      datasets: [{
        data: expenseData,
        backgroundColor: ['#B71C1C', '#C62828', '#D32F2F', '#E57373', '#EF9A9A', '#FFCDD2'],
        borderColor: '#fff',
        borderWidth: 1
      }]
    }
  });

  const incomeChart = new Chart(document.getElementById('incomeChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: incomeCategories,
      datasets: [{
        data: incomeData,
        backgroundColor: ['#388E3C', '#43A047', '#66BB6A', '#81C784'],
        borderColor: '#fff',
        borderWidth: 1
      }]
    }
  });
}

// Prepare chart data for the current month
async function prepareChartData(monthlyTransactions) {
  let expenseBreakdown = { "家賃": 0, "公共料金": 0, "通信費": 0, "交通費": 0, "買い物": 0, "その他": 0 };
  let incomeBreakdown = { "給料": 0, "投資": 0, "お小遣い": 0, "その他": 0 };

  monthlyTransactions.forEach((transaction) => {
    const { amount, category, type } = transaction;

    if (type === "Income") {
      incomeBreakdown[category] += amount;
    } else if (type === "Expense") {
      expenseBreakdown[category] += amount;
    }
  });

  updateCharts(Object.values(expenseBreakdown), Object.values(incomeBreakdown));
}

// Firebase Auth state change (user login)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid;

    // Fetch current month transactions for expense and income calculation
    const monthlyTransactions = await fetchUserTransactionsForCurrentMonth(userId);

    // Fetch all user transactions for savings calculation
    const allTransactions = await fetchAllUserTransactions(userId);

    // Update totals (Income, Expense, and Savings) for the current month and all-time savings
    await updateTotals(monthlyTransactions, allTransactions);

    // Prepare and update charts for the current month's income and expenses
    await prepareChartData(monthlyTransactions);
  } else {
    console.log("No user logged in");
  }
});

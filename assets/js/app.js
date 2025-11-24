const STORAGE_KEYS = {
  theme: "edufinance-theme",
  user: "edufinance-user",
  expenses: "edufinance-expenses",
  split: "edufinance-split-expenses",
  friends: "edufinance-friends",
};

const defaultUser = {
  name: "Student",
  email: "student@edufinance.com",
  budget: 5000,
  currency: "Birr",
  notifications: true,
};

const defaultExpenses = [
  { id: "1", date: "2025-11-20", category: "Food", amount: 120, notes: "Lunch at cafeteria" },
  { id: "2", date: "2025-11-19", category: "Transport", amount: 80, notes: "Bus fare" },
  { id: "3", date: "2025-11-19", category: "Books", amount: 450, notes: "Textbooks for semester" },
  { id: "4", date: "2025-11-18", category: "Entertainment", amount: 200, notes: "Movie with friends" },
  { id: "5", date: "2025-11-17", category: "Food", amount: 95, notes: "Groceries" },
];

const defaultTips = [
  {
    icon: "💡",
    title: "Track Daily Spending",
    preview: "Record every expense to understand your habits.",
    checklist: [
      "Record all expenses as they happen",
      "Categorize your spending",
      "Review daily totals before bed",
      "Identify patterns in your spending",
    ],
  },
  {
    icon: "🎯",
    title: "Set Budget Goals",
    preview: "Break down monthly goals into daily limits.",
    checklist: ["Calculate your monthly budget", "Divide into weekly targets", "Reserve money for fixed costs", "Keep an emergency buffer"],
  },
  {
    icon: "🍽️",
    title: "Meal Planning Saves Money",
    preview: "Plan meals to curb impulse purchases.",
    checklist: ["Plan meals for the week", "Make a shopping list", "Cook in batches", "Pack lunch instead of buying"],
  },
  {
    icon: "📚",
    title: "Smart Book Buying",
    preview: "Use library resources and second-hand books.",
    checklist: ["Check library first", "Buy used when possible", "Share with classmates", "Sell books after use"],
  },
  {
    icon: "🚗",
    title: "Transportation Tips",
    preview: "Optimize commutes to save on transport costs.",
    checklist: ["Use monthly transport passes", "Carpool when possible", "Walk short distances", "Plan efficient routes"],
  },
];

const defaultSplitFriends = [
  { id: "1", name: "Alex", avatar: "👨" },
  { id: "2", name: "Sarah", avatar: "👩" },
  { id: "3", name: "Mike", avatar: "🧑" },
];

const defaultSplitExpenses = [
  {
    id: "1",
    description: "Dinner at restaurant",
    totalAmount: 450,
    paidBy: "me",
    date: "2025-11-20",
    splitBetween: ["me", "1", "2"],
    settled: false,
  },
  {
    id: "2",
    description: "Movie tickets",
    totalAmount: 300,
    paidBy: "3",
    date: "2025-11-19",
    splitBetween: ["me", "3"],
    settled: false,
  },
];

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

const clone = (value) => JSON.parse(JSON.stringify(value));

const loadState = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback);
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to load ${key}`, error);
    return clone(fallback);
  }
};

const saveState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key}`, error);
  }
};

const showToast = (message) => {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._timeout);
  showToast._timeout = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
};

const formatCurrency = (amount, currency) => {
  return `${currency === "USD" ? "$" : "Birr"} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const calculateStats = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  const thisWeek = expenses.filter((expense) => new Date(expense.date) >= weekAgo);

  return {
    total,
    averageDaily: expenses.length ? total / 7 : 0,
    weekCount: thisWeek.length,
  };
};

let user = loadState(STORAGE_KEYS.user, defaultUser);
let expenses = loadState(STORAGE_KEYS.expenses, defaultExpenses);
let splitFriends = loadState(STORAGE_KEYS.friends, defaultSplitFriends);
let splitExpenses = loadState(STORAGE_KEYS.split, defaultSplitExpenses);
let editingId = null;

const syncTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : prefersDark;
  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("theme-light", !isDark);
  const toggle = qs("#themeToggle");
  if (toggle) {
    toggle.textContent = isDark ? "☀️" : "🌙";
  }
};

const toggleTheme = () => {
  const isDark = document.body.classList.toggle("theme-dark");
  document.body.classList.toggle("theme-light", !isDark);
  localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
  const toggle = qs("#themeToggle");
  if (toggle) {
    toggle.textContent = isDark ? "☀️" : "🌙";
  }
};

const updateHeroPreview = () => {
  const stats = calculateStats(expenses);
  const total = stats.total;
  const remaining = Math.max(user.budget - total, 0);

  const totalSpentEl = qs('[data-key="totalSpent"]');
  const remainingEl = qs('[data-key="remainingBudget"]');
  const countEl = qs('[data-key="transactionCount"]');

  if (totalSpentEl) totalSpentEl.textContent = formatCurrency(total, user.currency);
  if (remainingEl) remainingEl.textContent = formatCurrency(remaining, user.currency);
  if (countEl) countEl.textContent = stats.weekCount.toString();
};

const updateDashboard = () => {
  const stats = calculateStats(expenses);
  const progress = Math.min(Math.round((stats.total / user.budget) * 100), 100);

  const progressBar = qs('[data-key="budgetProgress"]');
  const spentEl = qs('[data-key="progressSpent"]');
  const budgetEl = qs('[data-key="progressBudget"]');
  const avgEl = qs('[data-key="avgDaily"]');

  if (progressBar) progressBar.style.width = `${progress}%`;
  if (spentEl) spentEl.textContent = formatCurrency(stats.total, user.currency);
  if (budgetEl) budgetEl.textContent = formatCurrency(user.budget, user.currency);
  if (avgEl) avgEl.textContent = formatCurrency(stats.averageDaily, user.currency);
};

const renderExpenseRow = (expense) => {
  const row = document.createElement("div");
  row.className = "table-row";
  row.dataset.id = expense.id;
  row.innerHTML = `
    <span>${expense.date}</span>
    <span>${expense.category}</span>
    <span class="align-right">${formatCurrency(expense.amount, user.currency)}</span>
    <span>${expense.notes}</span>
    <span class="align-right">
      <button class="btn btn-ghost" data-action="edit">Edit</button>
      <button class="btn btn-ghost" data-action="delete">Delete</button>
    </span>
  `;
  return row;
};

const populateExpensesTable = () => {
  const container = qs("#expenseRows");
  if (!container) return;
  container.innerHTML = "";
  expenses
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((expense) => container.appendChild(renderExpenseRow(expense)));
};

const computeCategoryTotals = (source) => {
  const totals = new Map();
  source.forEach((expense) => {
    totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
  });
  return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
};

const populateAnalysis = () => {
  const totals = computeCategoryTotals(expenses);
  const topList = qs("#topCategories");
  const totalEl = qs('[data-key="analysisTotal"]');
  const avgEl = qs('[data-key="analysisAverage"]');
  const chart = qs("#dailyTotals");

  const stats = calculateStats(expenses);
  if (totalEl) totalEl.textContent = formatCurrency(stats.total, user.currency);
  if (avgEl) avgEl.textContent = formatCurrency(stats.averageDaily, user.currency);

  if (topList) {
    topList.innerHTML = "";
    totals.slice(0, 3).forEach(([category, amount], index) => {
      const item = document.createElement("li");
      const percentage = stats.total ? ((amount / stats.total) * 100).toFixed(1) : 0;
      item.textContent = `${index + 1}. ${category} — ${formatCurrency(amount, user.currency)} (${percentage}%)`;
      topList.appendChild(item);
    });
    if (!totals.length) {
      const empty = document.createElement("li");
      empty.textContent = "No expenses yet";
      topList.appendChild(empty);
    }
  }

  if (chart) {
    chart.innerHTML = "";
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      const dayTotal = expenses
        .filter((expense) => expense.date === dateKey)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const bar = document.createElement("div");
      bar.className = "spark-bar";
      const height = stats.total ? Math.max((dayTotal / stats.total) * 100, 6) : 6;
      bar.style.height = `${height}%`;
      bar.title = `${date.toLocaleDateString(undefined, { weekday: "short" })}: ${formatCurrency(dayTotal, user.currency)}`;
      chart.appendChild(bar);
    }
  }
};

const populateTips = () => {
  const container = qs("#tipsList");
  if (!container) return;
  container.innerHTML = "";
  defaultTips.forEach((tip, index) => {
    const card = document.createElement("article");
    card.className = "tip-card";
    card.dataset.index = index;
    card.innerHTML = `
      <span class="big-number">${tip.icon}</span>
      <h3>${tip.title}</h3>
      <p>${tip.preview}</p>
      <ul>${tip.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
    `;
    container.appendChild(card);
  });
};

const populateProfile = () => {
  const nameEl = qs('[data-key="profileName"]');
  const emailEl = qs('[data-key="profileEmail"]');
  const avatar = qs(".avatar");
  const budgetInput = qs("#profileBudget");
  const currencySelect = qs("#profileCurrency");
  const notificationToggle = qs("#profileNotifications");

  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (avatar) avatar.dataset.initial = user.name.charAt(0).toUpperCase();
  if (budgetInput) budgetInput.value = user.budget;
  if (currencySelect) currencySelect.value = user.currency;
  if (notificationToggle) notificationToggle.checked = user.notifications;
};

const populateSplit = () => {
  const balanceList = qs("#balanceList");
  const expenseList = qs("#splitExpenses");
  if (!balanceList || !expenseList) return;

  const balances = {};
  splitFriends.forEach((friend) => {
    balances[friend.id] = 0;
  });

  splitExpenses.forEach((expense) => {
    if (expense.settled) return;
    const share = expense.totalAmount / expense.splitBetween.length;
    expense.splitBetween.forEach((participant) => {
      if (participant === "me") return;
      balances[participant] += share;
    });
    if (expense.paidBy !== "me" && expense.paidBy !== undefined) {
      balances[expense.paidBy] -= expense.totalAmount;
    }
  });

  balanceList.innerHTML = "";
  Object.entries(balances).forEach(([friendId, amount]) => {
    const friend = splitFriends.find((f) => f.id === friendId);
    if (!friend) return;
    if (Math.abs(amount) < 0.01) return;
    const item = document.createElement("li");
    const prefix = amount > 0 ? "owes you" : "you owe";
    item.textContent = `${friend.avatar} ${friend.name} ${prefix} ${formatCurrency(Math.abs(amount), user.currency)}`;
    balanceList.appendChild(item);
  });

  if (!balanceList.children.length) {
    const clear = document.createElement("li");
    clear.textContent = "All balances settled";
    balanceList.appendChild(clear);
  }

  expenseList.innerHTML = "";
  splitExpenses.slice(0, 5).forEach((expense) => {
    const item = document.createElement("li");
    const paidBy = expense.paidBy === "me" ? "You" : splitFriends.find((f) => f.id === expense.paidBy)?.name || "Friend";
    item.textContent = `${expense.description} — ${formatCurrency(expense.totalAmount, user.currency)} (paid by ${paidBy})`;
    expenseList.appendChild(item);
  });
};

const updateAll = () => {
  updateHeroPreview();
  updateDashboard();
  populateExpensesTable();
  populateAnalysis();
  populateProfile();
  populateSplit();
};

const openModal = (expense) => {
  const overlay = qs("#modalOverlay");
  if (!overlay) return;
  overlay.hidden = false;
  const form = qs("#expenseForm");
  if (!form) return;
  const dateInput = qs("#expenseDate");
  const amountInput = qs("#expenseAmount");
  const categoryInput = qs("#expenseCategory");
  const notesInput = qs("#expenseNotes");

  if (expense) {
    editingId = expense.id;
    dateInput.value = expense.date;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    notesInput.value = expense.notes;
  } else {
    editingId = null;
    dateInput.value = new Date().toISOString().split("T")[0];
    amountInput.value = "";
    categoryInput.value = "Food";
    notesInput.value = "";
  }
  dateInput.focus();
};

const closeModal = () => {
  const overlay = qs("#modalOverlay");
  if (!overlay) return;
  overlay.hidden = true;
  editingId = null;
};

const handleExpenseSubmit = (event) => {
  event.preventDefault();
  const dateInput = qs("#expenseDate");
  const amountInput = qs("#expenseAmount");
  const categoryInput = qs("#expenseCategory");
  const notesInput = qs("#expenseNotes");

  const amount = parseFloat(amountInput.value || "0");
  if (!amount || amount <= 0) {
    showToast("Amount must be greater than 0");
    return;
  }

  const payload = {
    id: editingId || Date.now().toString(),
    date: dateInput.value,
    category: categoryInput.value,
    amount,
    notes: notesInput.value.trim() || "Expense",
  };

  if (editingId) {
    expenses = expenses.map((expense) => (expense.id === editingId ? payload : expense));
    showToast("Expense updated");
  } else {
    expenses = [payload, ...expenses];
    showToast("Expense added");
  }

  saveState(STORAGE_KEYS.expenses, expenses);
  updateAll();
  closeModal();
};

const handleExpenseAction = (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  const row = event.target.closest(".table-row");
  if (!row) return;
  const id = row.dataset.id;
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;

  if (action === "edit") {
    openModal(expense);
  } else if (action === "delete") {
    expenses = expenses.filter((item) => item.id !== id);
    saveState(STORAGE_KEYS.expenses, expenses);
    updateAll();
    showToast("Expense deleted");
  }
};

const exportCsv = () => {
  const header = ["Date", "Category", "Amount", "Notes"];
  const lines = expenses.map((expense) => {
    const safeNotes = `"${expense.notes.replace(/"/g, '""')}"`;
    return [expense.date, expense.category, expense.amount.toFixed(2), safeNotes].join(",");
  });
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "expenses.csv";
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported");
};

const exportPdf = () => {
  window.print();
  showToast("Use browser print dialog to save as PDF");
};

const shareAnalysis = () => {
  const stats = calculateStats(expenses);
  const summary = `EduFinance summary — Total: ${formatCurrency(stats.total, user.currency)}, Avg daily: ${formatCurrency(stats.averageDaily, user.currency)}, Transactions this week: ${stats.weekCount}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(summary).then(() => showToast("Summary copied"));
  } else {
    showToast(summary);
  }
};

const handleProfileSave = () => {
  const budgetInput = qs("#profileBudget");
  const currencySelect = qs("#profileCurrency");
  const notificationToggle = qs("#profileNotifications");

  user = {
    ...user,
    budget: parseFloat(budgetInput.value || "0") || defaultUser.budget,
    currency: currencySelect.value,
    notifications: notificationToggle.checked,
  };

  saveState(STORAGE_KEYS.user, user);
  updateAll();
  showToast("Profile updated");
};

const clearDemoData = () => {
  user = clone(defaultUser);
  expenses = clone(defaultExpenses);
  splitFriends = clone(defaultSplitFriends);
  splitExpenses = clone(defaultSplitExpenses);
  saveState(STORAGE_KEYS.user, user);
  saveState(STORAGE_KEYS.expenses, expenses);
  saveState(STORAGE_KEYS.friends, splitFriends);
  saveState(STORAGE_KEYS.split, splitExpenses);
  updateAll();
  showToast("Demo data restored");
};

const initEvents = () => {
  qs("#themeToggle")?.addEventListener("click", toggleTheme);
  qs("#mobileToggle")?.addEventListener("click", () => {
    const menu = qs("#mobileMenu");
    if (!menu) return;
    const expanded = menu.hidden;
    menu.hidden = !expanded;
    const toggle = qs("#mobileToggle");
    if (toggle) toggle.setAttribute("aria-expanded", expanded.toString());
  });

  qs("#openDemo")?.addEventListener("click", () => openModal());
  qs("#mockLogin")?.addEventListener("click", () => showToast("Login validated (demo)"));
  qs("#modalClose")?.addEventListener("click", closeModal);
  qs("#modalCancel")?.addEventListener("click", closeModal);
  qs("#modalOverlay")?.addEventListener("click", (event) => {
    if (event.target.id === "modalOverlay") closeModal();
  });
  qs("#expenseForm")?.addEventListener("submit", handleExpenseSubmit);
  qs("#expenseRows")?.addEventListener("click", handleExpenseAction);
  qs("#exportCsv")?.addEventListener("click", exportCsv);
  qs("#exportPdf")?.addEventListener("click", exportPdf);
  qs("#analysisShare")?.addEventListener("click", shareAnalysis);
  qs("#profileSave")?.addEventListener("click", handleProfileSave);
  qs("#clearData")?.addEventListener("click", clearDemoData);
  qs("#categoryFilter")?.addEventListener("change", (event) => {
    const value = event.target.value;
    const filtered = value === "all" ? expenses : expenses.filter((expense) => expense.category === value);
    const totals = computeCategoryTotals(filtered);
    const topList = qs("#topCategories");
    if (!topList) return;
    topList.innerHTML = "";
    totals.slice(0, 3).forEach(([category, amount], index) => {
      const item = document.createElement("li");
      item.textContent = `${index + 1}. ${category} — ${formatCurrency(amount, user.currency)}`;
      topList.appendChild(item);
    });
    if (!totals.length) {
      const empty = document.createElement("li");
      empty.textContent = "No expenses for this filter";
      topList.appendChild(empty);
    }
  });
};

const bootstrap = () => {
  syncTheme();
  populateTips();
  populateProfile();
  populateSplit();
  updateAll();
  initEvents();
};

document.addEventListener("DOMContentLoaded", bootstrap);

document.addEventListener("DOMContentLoaded", () => {
    // Mark that we're not on an auth page
    window.__onAuthPage = false;
    
    // Initialize theme first using ThemeManager
    if (window.ThemeManager && typeof window.ThemeManager.init === 'function') {
        window.ThemeManager.init();
    } else if (typeof initTheme === 'function') {
        // Fallback to direct initTheme if ThemeManager is not available
        initTheme();
    }
    
    // Wait for Firebase to be ready before checking auth
    // This ensures Firebase auth state is restored before we check
    const checkAuthAndInit = () => {
        // Wait for Firebase to initialize
        if (window.firebaseAuth) {
            // Firebase is available, check auth
    if (!App.initPageShell({ auth: true })) {
                // Auth check failed, will redirect to login
        return;
    }
            // Auth check passed, initialize dashboard
            initDashboard();
        } else if (window.firebaseReady === false) {
            // Firebase failed to load, check localStorage as fallback
            const session = App.getSession();
            if (!session?.isAuthenticated) {
                window.location.href = "login.html";
                return;
            }
            // Has localStorage session, allow access
            initDashboard();
        } else {
            // Firebase still loading, wait a bit more
            setTimeout(checkAuthAndInit, 200);
        }
    };
    
    // Start checking after a short delay to allow scripts to load
    setTimeout(checkAuthAndInit, 300);
});

function initDashboard() {
    
    // Direct logout functionality
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                // Clear session storage
                if (window.localStorage) {
                    window.localStorage.removeItem('edufinance-session');
                    window.localStorage.removeItem('edufinance-user');
                }
                
                // Show logout message
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.textContent = 'Logged out successfully';
                document.body.appendChild(toast);
                
                // Trigger animation
                setTimeout(() => toast.classList.add('show'), 10);
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 500);
                
            } catch (error) {
                console.error('Error during logout:', error);
                window.location.href = 'login.html';
            }
        });
    }

    // Initialize modal with close handlers
    const modal = App.initModal ? App.initModal() : null;

    let user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    let expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
    let editingId = null;
    let filteredCategory = "all";
    let currentRange = "week";
    let customFrom = null;
    let customTo = null;

    const statusPill = App.qs("[data-key=\"statusPill\"]");

    const getRangeLabel = () => {
        if (currentRange === "week") return "This week";
        if (currentRange === "month") return "This month";
        return "Custom";
    };

    const getExpensesInRange = () => {
        let start;
        let end = new Date();

        if (currentRange === "week") {
            start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
        } else if (currentRange === "month") {
            start = new Date(end);
            start.setMonth(start.getMonth() - 1);
        } else if (currentRange === "custom") {
            if (customFrom && customTo) {
                start = new Date(customFrom);
                end = new Date(customTo);
            } else if (selectedDate) {
                // Use selected date if custom range is set but from/to not specified
                const date = new Date(selectedDate);
                start = new Date(date.setHours(0, 0, 0, 0));
                end = new Date(date.setHours(23, 59, 59, 999));
            } else {
                // Fallback to all data
                return expenses.slice();
            }
        } else {
            // Fallback to all data
            return expenses.slice();
        }

        return expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            expenseDate.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return expenseDate >= start && expenseDate <= end;
        });
    };

    const updateHero = () => {
        const rangeExpenses = getExpensesInRange();
        const stats = App.calculateStats(rangeExpenses);
        const total = stats.total;
        const remaining = Math.max(user.budget - total, 0);
        const progressPercent = user.budget ? Math.min(Math.round((total / user.budget) * 100), 100) : 0;

        App.qs('[data-key="currentRangeLabel"]').textContent = getRangeLabel();
        App.qs('[data-key="userName"]').textContent = user.name || "Student";

        App.qs('[data-key="totalSpent"]').textContent = App.formatCurrency(total, user.currency);
        App.qs('[data-key="remainingBudget"]').textContent = App.formatCurrency(remaining, user.currency);
        App.qs('[data-key="transactionCount"]').textContent = rangeExpenses.length.toString();

        const progressBar = App.qs('[data-key="budgetProgress"]');
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
            progressBar.classList.toggle("progress-bar-danger", total > user.budget);
        }

        App.qs('[data-key="progressSpent"]').textContent = App.formatCurrency(total, user.currency);
        App.qs('[data-key="progressBudget"]').textContent = App.formatCurrency(user.budget, user.currency);

        const status = total > user.budget ? "Over budget" : progressPercent > 80 ? "Monitor" : "On track";
        if (statusPill) {
            statusPill.textContent = status;
            statusPill.classList.toggle("status-pill-danger", status === "Over budget");
        }

        App.qs('[data-key="avgDaily"]').textContent = App.formatCurrency(stats.averageDaily, user.currency);

        const applySparkline = (selector, value) => {
            const el = App.qs(`[data-sparkline="${selector}"]`);
            if (!el) return;
            const scale = Math.min(Math.max(value, 0), 1);
            el.style.setProperty("--spark-scale", scale);
            el.querySelector("::after"); // ensure computed
        };

        applySparkline("total", Math.min(total / (user.budget || 1), 1));
        applySparkline("remain", Math.min(remaining / (user.budget || 1), 1));
        applySparkline("count", Math.min(rangeExpenses.length / 10, 1));
        applySparkline("avg", Math.min(stats.averageDaily / ((user.budget || 1) / 7), 1));
    };

    const renderExpenseRow = (expense) => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.dataset.id = expense.id;
        row.innerHTML = `
            <span data-label="Date">${expense.date}</span>
            <span data-label="Category">${expense.category}</span>
            <span data-label="Amount" class="align-right">${App.formatCurrency(expense.amount, user.currency)}</span>
            <span data-label="Notes">${expense.notes}</span>
            <span data-label="Actions" class="align-right">
                <button class="btn btn-ghost" data-action="edit">Edit</button>
                <button class="btn btn-ghost" data-action="delete">Delete</button>
            </span>
        `;
        return row;
    };

    const getFilteredExpenses = () => {
        const inRange = getExpensesInRange();
        if (filteredCategory === "all") return inRange.slice();
        return inRange.filter((expense) => expense.category === filteredCategory);
    };

    const populateExpensesTable = () => {
        const container = App.qs("#expenseRows");
        if (!container) return;
        container.innerHTML = "";
        const source = getFilteredExpenses()
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7);

        updateExpenseInsights(getExpensesInRange());

        if (!source.length) {
            const empty = document.createElement("div");
            empty.className = "table-row";
            empty.innerHTML = "<span>No expenses yet</span>";
            container.appendChild(empty);
            return;
        }

        source.forEach((expense) => container.appendChild(renderExpenseRow(expense)));
    };

    const spendChartId = "expensesRangeChart";
    const topChartId = "expensesTopChart";
    const avgChartId = "expensesAvgChart";

    const chartStore = {};

    const renderMiniChart = (key, configBuilder) => {
        const canvas = App.qs(`#${key}`);
        if (!canvas || typeof Chart === "undefined") return;
        const ctx = canvas.getContext("2d");
        if (chartStore[key]) chartStore[key].destroy();
        chartStore[key] = new Chart(ctx, configBuilder());
    };

    const updateExpenseInsights = (rangeSource) => {
        const stats = App.calculateStats(rangeSource);
        const totalEl = App.qs('[data-key="expensesRangeTotal"]');
        const countEl = App.qs('[data-key="expensesRangeCount"]');
        const topEl = App.qs('[data-key="expensesTopCategory"]');
        const shareEl = App.qs('[data-key="expensesTopShare"]');
        const avgEl = App.qs('[data-key="expensesAverage"]');

        if (totalEl) totalEl.textContent = App.formatCurrency(stats.total, user.currency);
        if (countEl) countEl.textContent = `${rangeSource.length || 0} transactions`;

        const avgTicket = rangeSource.length ? stats.total / rangeSource.length : 0;
        if (avgEl) avgEl.textContent = App.formatCurrency(avgTicket, user.currency);

        const totals = computeCategoryTotals(rangeSource);
        if (totals.length && topEl && shareEl) {
            const [category, value] = totals[0];
            const share = stats.total ? ((value / stats.total) * 100).toFixed(1) : 0;
            topEl.textContent = category;
            shareEl.textContent = `${share}% of spending`;
        } else {
            if (topEl) topEl.textContent = "—";
            if (shareEl) shareEl.textContent = "Waiting for data";
        }

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const baseText = isDark ? "#bdc3c7" : "#7f8c8d";
        const borderColor = isDark ? "#3e5368" : "#e0e3e7";

        renderMiniChart(spendChartId, () => ({
            type: "doughnut",
            data: {
                labels: ["Spent", "Remaining"],
                datasets: [
                    {
                        data: [stats.total, Math.max(user.budget - stats.total, 0)],
                        backgroundColor: ["#27ae60", borderColor],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                cutout: "70%",
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
            },
        }));

        const topShare = totals.length && stats.total ? (totals[0][1] / stats.total) * 100 : 0;
        renderMiniChart(topChartId, () => ({
            type: "polarArea",
            data: {
                labels: ["Top category", "Other"],
                datasets: [
                    {
                        data: [topShare, 100 - topShare],
                        backgroundColor: ["rgba(39, 174, 96, 0.85)", "rgba(44, 62, 80, 0.12)"],
                        borderColor: borderColor,
                    },
                ],
            },
            options: {
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
            },
        }));

        const dailyAvg = stats.total ? stats.total / 7 : 0;
        renderMiniChart(avgChartId, () => ({
            type: "bar",
            data: {
                labels: ["Avg ticket"],
                datasets: [
                    {
                        data: [avgTicket],
                        backgroundColor: "rgba(243, 156, 18, 0.85)",
                        borderRadius: 6,
                        barThickness: 26,
                    },
                ],
            },
            options: {
                scales: {
                    y: { display: false, suggestedMax: Math.max(avgTicket * 1.3, dailyAvg) },
                    x: { display: false },
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
            },
        }));
    };

    const bindExpenseChips = () => {
        const chips = Array.from(document.querySelectorAll("[data-expense-chip]"));
        if (!chips.length) return;
        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                const category = chip.dataset.expenseChip;
                filteredCategory = category;
                chips.forEach((c) => c.classList.toggle("is-active", c === chip));
                const select = App.qs("#categoryFilter");
                if (select) select.value = category;
                populateExpensesTable();
            });
        });
    };

    const computeCategoryTotals = (source) => {
        const totals = new Map();
        source.forEach((expense) => {
            totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
        });
        return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    };

    const populateAnalysis = () => {
        const rangeExpenses = getExpensesInRange();
        const totals = computeCategoryTotals(rangeExpenses);
        const topList = App.qs("#topCategories");
        const totalEl = App.qs('[data-key="analysisTotal"]');
        const avgEl = App.qs('[data-key="analysisAverage"]');
        const stats = App.calculateStats(rangeExpenses);

        if (totalEl) totalEl.textContent = App.formatCurrency(stats.total, user.currency);
        if (avgEl) avgEl.textContent = App.formatCurrency(stats.averageDaily, user.currency);

        if (topList) {
            topList.innerHTML = "";
            totals.slice(0, 3).forEach(([category, amount], index) => {
                const item = document.createElement("li");
                const percentage = stats.total ? ((amount / stats.total) * 100).toFixed(1) : 0;
                item.textContent = `${index + 1}. ${category} — ${App.formatCurrency(amount, user.currency)} (${percentage}%)`;
                topList.appendChild(item);
            });
            if (!totals.length) {
                const empty = document.createElement("li");
                empty.textContent = "No expenses yet";
                topList.appendChild(empty);
            }
        }

        const chartCanvas = App.qs("#dailyTotalsChart");
        if (chartCanvas && typeof Chart !== "undefined") {
            const inRange = getExpensesInRange();
            const labels = [];
            const data = [];
            // Build daily buckets based on current range
            let start;
            let end = new Date();
            if (currentRange === "week") {
                start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
            } else if (currentRange === "month") {
                start = new Date(end);
                start.setMonth(start.getMonth() - 1);
            } else if (currentRange === "custom" && customFrom && customTo) {
                start = customFrom;
                end = customTo;
            } else {
                // default last 7 days
                start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
            }

            const oneDay = 24 * 60 * 60 * 1000;
            for (let d = new Date(start); d <= end; d = new Date(d.getTime() + oneDay)) {
                const dateKey = d.toISOString().split("T")[0];
                const dayTotal = inRange
                    .filter((expense) => expense.date === dateKey)
                    .reduce((sum, expense) => sum + expense.amount, 0);
                labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
                data.push(dayTotal);
            }

            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            if (window.dashboardLineChart) {
                window.dashboardLineChart.destroy();
            }
            const ctx = chartCanvas.getContext("2d");
            window.dashboardLineChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Daily spending",
                        data,
                        borderColor: isDark ? "#27ae60" : "#1f8a4e",
                        backgroundColor: isDark ? "rgba(39, 174, 96, 0.2)" : "rgba(39, 174, 96, 0.1)",
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: isDark ? "#27ae60" : "#1f8a4e",
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: isDark ? "#bdc3c7" : "#7f8c8d" },
                            grid: { color: isDark ? "#3e5368" : "#e0e3e7" },
                        },
                        x: {
                            ticks: { color: isDark ? "#bdc3c7" : "#7f8c8d" },
                            grid: { color: isDark ? "#3e5368" : "#e0e3e7" },
                        },
                    },
                },
            });
        }

        const categoryCanvas = App.qs("#categoryShareChart");
        if (categoryCanvas && typeof Chart !== "undefined") {
            const totals = computeCategoryTotals(rangeExpenses);
            const labels = totals.map(([category]) => category);
            const values = totals.map(([, amount]) => amount);
            const colors = ["#27ae60", "#f39c12", "#3498db", "#9b59b6", "#e74c3c"];

            if (window.dashboardPieChart) window.dashboardPieChart.destroy();

            window.dashboardPieChart = new Chart(categoryCanvas.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [
                        {
                            data: values,
                            backgroundColor: colors,
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: document.documentElement.getAttribute("data-theme") === "dark"
                                    ? "#bdc3c7"
                                    : "#7f8c8d",
                            },
                        },
                    },
                },
            });
        }
    };

    const populateTips = () => {
        const container = App.qs("#tipsList");
        if (!container) return;
        container.innerHTML = "";
        App.defaultTips.forEach((tip) => {
            const card = document.createElement("article");
            card.className = "card tip-card";
            card.innerHTML = `
                <span class="big-number" role="img" aria-label="Tip icon">${tip.icon}</span>
                <h3>${tip.title}</h3>
                <p>${tip.preview}</p>
                <ul>${tip.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
            `;
            container.appendChild(card);
        });
    };

    // Reminders functionality
    const REMINDERS_KEY = "edufinance-reminders";
    let reminders = App.loadState(REMINDERS_KEY, [
        "Pay library fine — Birr 45 (due Friday)",
        "Class trip contribution — Birr 150 (next week)",
        "Monthly savings transfer — Birr 300 (1st of month)"
    ]);

    const renderReminders = () => {
        const remindersList = App.qs("#remindersList");
        if (!remindersList) return;
        
        remindersList.innerHTML = "";
        if (reminders.length === 0) {
            remindersList.innerHTML = "<li class='no-data'>No reminders yet. Click '+ Add' to create one.</li>";
            return;
        }
        
        reminders.forEach((reminder, index) => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.innerHTML = `
                <span>${reminder}</span>
                <button type="button" class="btn-icon btn-icon-delete" data-reminder-index="${index}" aria-label="Delete reminder" style="margin-left: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            remindersList.appendChild(li);
        });
        
        // Add delete handlers
        remindersList.querySelectorAll("[data-reminder-index]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = parseInt(e.target.closest("[data-reminder-index]").dataset.reminderIndex);
                reminders.splice(index, 1);
                App.saveState(REMINDERS_KEY, reminders);
                renderReminders();
                App.showToast("Reminder deleted");
            });
        });
    };

    const initReminderModal = () => {
        const reminderModal = App.qs("#reminderModal");
        const reminderForm = App.qs("#reminderForm");
        const reminderText = App.qs("#reminderText");
        const addReminderBtn = App.qs("#addReminderBtn");
        const reminderModalClose = App.qs("#reminderModalClose");
        const reminderCancel = App.qs("#reminderCancel");
        
        if (!reminderModal || !reminderForm) return;
        
        const openReminderModal = () => {
            reminderModal.hidden = false;
            if (reminderText) {
                reminderText.value = "";
                reminderText.focus();
            }
        };
        
        const closeReminderModal = () => {
            reminderModal.hidden = true;
            if (reminderForm) reminderForm.reset();
        };
        
        addReminderBtn?.addEventListener("click", openReminderModal);
        reminderModalClose?.addEventListener("click", closeReminderModal);
        reminderCancel?.addEventListener("click", closeReminderModal);
        
        reminderModal?.addEventListener("click", (e) => {
            if (e.target === reminderModal) closeReminderModal();
        });
        
        reminderForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            const text = reminderText?.value.trim();
            if (!text) {
                App.showToast("Please enter a reminder", "error");
                return;
            }
            
            reminders.push(text);
            App.saveState(REMINDERS_KEY, reminders);
            renderReminders();
            closeReminderModal();
            App.showToast("Reminder added");
        });
    };

    // Calendar functionality
    let selectedDate = App.loadState("edufinance-selected-date", null);

    const initCalendar = () => {
        const selectedDateInput = App.qs("#selectedDate");
        const applyDateBtn = App.qs("#applyDate");
        
        if (selectedDateInput && selectedDate) {
            selectedDateInput.value = selectedDate;
        }
        
        applyDateBtn?.addEventListener("click", () => {
            const date = selectedDateInput?.value;
            if (!date) {
                App.showToast("Please select a date", "error");
                return;
            }
            
            selectedDate = date;
            App.saveState("edufinance-selected-date", selectedDate);
            
            // Update dashboard to show selected date
            const dateDisplay = App.qs('[data-key="currentRangeLabel"]');
            if (dateDisplay) {
                const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                dateDisplay.textContent = formattedDate;
                currentRange = "custom";
                customFrom = new Date(date);
                customTo = new Date(date);
            }
            
            App.showToast(`Date selected: ${new Date(date).toLocaleDateString()}`);
            updateAll();
        });
    };

    // Date range controls
    const initDateRangeControls = () => {
        const chips = App.qsa(".date-range-toggle .chip");
        const customRange = App.qs(".date-range-custom");
        const applyCustomBtn = App.qs("#applyCustomRange");
        const customFromInput = App.qs("#customFrom");
        const customToInput = App.qs("#customTo");

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                chips.forEach((c) => {
                    c.classList.remove("chip-active", "aria-selected");
                    c.setAttribute("aria-selected", "false");
                });
                chip.classList.add("chip-active", "aria-selected");
                chip.setAttribute("aria-selected", "true");
                
                const range = chip.dataset.range;
                currentRange = range;
                
                if (customRange) {
                    customRange.hidden = range !== "custom";
                }
                
                updateAll();
            });
        });

        applyCustomBtn?.addEventListener("click", () => {
            const from = customFromInput?.value;
            const to = customToInput?.value;
            
            if (!from || !to) {
                App.showToast("Please select both dates", "error");
                return;
            }
            
            customFrom = new Date(from);
            customTo = new Date(to);
            currentRange = "custom";
            
            if (customFrom > customTo) {
                App.showToast("Start date must be before end date", "error");
                return;
            }
            
            updateAll();
            App.showToast("Date range applied");
        });
    };

    const updateAll = () => {
        updateHero();
        populateExpensesTable();
        populateAnalysis();
    };

    const openModal = (expense) => {
        const dateInput = App.qs("#expenseDate");
        const amountInput = App.qs("#expenseAmount");
        const categoryInput = App.qs("#expenseCategory");
        const notesInput = App.qs("#expenseNotes");
        const modalTitle = App.qs("#modalTitle");
        const submitButton = App.qs("#expenseForm button[type='submit']");

        if (expense) {
            editingId = expense.id;
            if (dateInput) dateInput.value = expense.date;
            if (amountInput) amountInput.value = expense.amount;
            if (categoryInput) categoryInput.value = expense.category;
            if (notesInput) notesInput.value = expense.notes;
            if (modalTitle) modalTitle.textContent = "Edit Expense";
            if (submitButton) submitButton.textContent = "Update Expense";
        } else {
            editingId = null;
            if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
            if (amountInput) amountInput.value = "";
            if (categoryInput) categoryInput.value = "Food";
            if (notesInput) notesInput.value = "";
            if (modalTitle) modalTitle.textContent = "Add Expense";
            if (submitButton) submitButton.textContent = "Save Expense";
        }
        if (dateInput) dateInput.focus();
        modal.open();
    };

    const closeModal = () => {
        editingId = null;
        modal.close();
    };

    const handleExpenseSubmit = (event) => {
        event.preventDefault();
        const dateInput = App.qs("#expenseDate");
        const amountInput = App.qs("#expenseAmount");
        const categoryInput = App.qs("#expenseCategory");
        const notesInput = App.qs("#expenseNotes");

        const amount = parseFloat(amountInput.value || "0");
        if (!amount || amount <= 0) {
            App.showToast("Enter a valid amount");
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
            expenses = expenses.map((item) => (item.id === editingId ? payload : item));
            App.showToast("Expense updated");
        } else {
            expenses = [...expenses, payload];
            App.showToast("Expense added");
        }

        App.saveState(App.STORAGE_KEYS.expenses, expenses);
        window.dispatchEvent(new Event("expensesUpdated"));
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
            App.saveState(App.STORAGE_KEYS.expenses, expenses);
            window.dispatchEvent(new Event("expensesUpdated"));
            App.showToast("Expense removed");
            updateAll();
        }
    };

    const exportCsv = () => {
        try {
            const header = ["Date", "Category", "Amount", "Notes"];
            const lines = expenses.map((expense) => {
                const safeNotes = (expense.notes || "").replace(/"/g, '""');
                return [expense.date, expense.category, expense.amount, safeNotes]
                    .map((value) => `"${value}"`)
                    .join(",");
            });
            const csv = [header.join(","), ...lines].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `expenses-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            App.showToast("CSV exported successfully!");
        } catch (error) {
            console.error("Error exporting CSV:", error);
            App.showToast("Error exporting CSV. Please try again.", "error");
        }
    };

    const handlePrint = () => {
        try {
            // Store the current display style of elements we want to hide during print
            const elementsToHide = document.querySelectorAll('.site-header, .site-footer, .page-sidebar');
            const originalDisplays = [];
            
            // Hide elements that shouldn't be printed
            elementsToHide.forEach(el => {
                originalDisplays.push(el.style.display);
                el.style.display = 'none';
            });
            
            // Add print-specific styles
            const style = document.createElement('style');
            style.textContent = `
                @media print {
                    @page { margin: 1cm; }
                    body { font-size: 12pt; }
                    .no-print { display: none !important; }
                    .card { box-shadow: none; border: 1px solid #ddd; }
                    .section { break-inside: avoid; }
                }
            `;
            document.head.appendChild(style);
            
            // Trigger print
            setTimeout(() => {
                window.print();
                
                // Clean up after printing
                setTimeout(() => {
                    // Restore original display styles
                    elementsToHide.forEach((el, index) => {
                        el.style.display = originalDisplays[index];
                    });
                    
                    // Remove the print styles
                    if (style.parentNode === document.head) {
                        document.head.removeChild(style);
                    }
                    
                    App.showToast("Print dialog opened");
                }, 500);
            }, 100);
        } catch (error) {
            console.error("Error preparing print:", error);
            window.print(); // Fallback to basic print if our fancy version fails
        }
    };

    const exportPdf = async () => {
        try {
            // Use the jsPDF instance from the global scope
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const rangeExpenses = getExpensesInRange();
            const stats = App.calculateStats(rangeExpenses);
            const currentDate = new Date().toLocaleDateString();
            
            // Add title and date
            doc.setFontSize(20);
            doc.setTextColor(33, 37, 41);
            doc.text('Expense Report', 14, 22);
            
            // Add date range and generated date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${currentDate}`, 14, 30);
            doc.text(`Date Range: ${getRangeLabel()}`, 14, 37);
            
            // Add summary stats
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Summary', 14, 50);
            
            doc.setFontSize(11);
            doc.text(`Total Spent: ${App.formatCurrency(stats.total, user.currency)}`, 20, 60);
            doc.text(`Average Daily: ${App.formatCurrency(stats.averageDaily, user.currency)}`, 20, 70);
            doc.text(`Transactions: ${rangeExpenses.length}`, 20, 80);
            
            // Add a simple table of expenses if there are any
            if (rangeExpenses.length > 0) {
                doc.setFontSize(14);
                doc.text('Recent Transactions', 14, 100);
                
                // Prepare data for the table
                const tableColumn = ["Date", "Category", "Amount", "Notes"];
                const tableRows = [];
                
                rangeExpenses.slice(0, 20).forEach(expense => {
                    const expenseData = [
                        new Date(expense.date).toLocaleDateString(),
                        expense.category,
                        App.formatCurrency(expense.amount, user.currency),
                        expense.notes || ''
                    ];
                    tableRows.push(expenseData);
                });
                
                // Add the table using autoTable
                doc.autoTable({
                    head: [tableColumn],
                    body: tableRows,
                    startY: 110,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: [41, 128, 185],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: { 
                        fillColor: [245, 245, 245] 
                    },
                    margin: { top: 10 },
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                        overflow: 'linebreak',
                        lineWidth: 0.1
                    },
                    columnStyles: {
                        0: { cellWidth: 25 }, // Date
                        1: { cellWidth: 40 }, // Category
                        2: { cellWidth: 30 }, // Amount
                        3: { cellWidth: 'auto' } // Notes
                    }
                });
            }
            
            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.getWidth() - 30,
                    doc.internal.pageSize.getHeight() - 10
                );
            }
            
            // Save the PDF
            doc.save(`expense-report-${new Date().toISOString().split('T')[0]}.pdf`);
            App.showToast("PDF exported successfully!");
            
        } catch (error) {
            console.error("Error generating PDF:", error);
            App.showToast("Error generating PDF. Please try again.", "error");
        }
    };

    const shareAnalysis = () => {
        const rangeExpenses = getExpensesInRange();
        const stats = App.calculateStats(rangeExpenses);
        const summary = `EduFinance summary — Total: ${App.formatCurrency(stats.total, user.currency)}, Avg daily: ${App.formatCurrency(stats.averageDaily, user.currency)}, Transactions this week: ${stats.weekCount}`;
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(summary)
                .then(() => App.showToast("Summary copied"))
                .catch(() => App.showToast("Clipboard unavailable"));
        } else {
            App.showToast("Clipboard unavailable");
        }
    };


    const initEvents = () => {
        // Expense-related event listeners
        App.qs("#expenseRows")?.addEventListener("click", handleExpenseAction);
        App.qs("#addExpenseButton")?.addEventListener("click", () => openModal());
        App.qs("#exportCsv")?.addEventListener("click", exportCsv);
        App.qs("#exportPdf")?.addEventListener("click", exportPdf);
        App.qs("#printButton")?.addEventListener("click", handlePrint);
        App.qs("#analysisShare")?.addEventListener("click", shareAnalysis);
        
        // Expense form submission
        const expenseForm = App.qs("#expenseForm");
        if (expenseForm) {
            expenseForm.addEventListener("submit", handleExpenseSubmit);
        }
        
        // Modal close handlers
        App.qs("#modalClose")?.addEventListener("click", closeModal);
        App.qs("#modalCancel")?.addEventListener("click", closeModal);
        App.qs("#modalOverlay")?.addEventListener("click", (e) => {
            if (e.target.id === "modalOverlay") closeModal();
        });
        
        // Category filter
        App.qs("#categoryFilter")?.addEventListener("change", (event) => {
            filteredCategory = event.target.value;
            populateExpensesTable();
        });

        // Initialize other components
        initDateRangeControls();
        bindExpenseChips();
        initCalendar();
        initReminderModal();
    };

    populateTips();
    populateAnalysis();
    updateAll();
    renderReminders();
    initEvents();

    // Listen for expense updates to refresh charts
    window.addEventListener("expensesUpdated", () => {
        expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
        updateAll();
    });

    // Refresh chart colors on theme change
    window.addEventListener("themechange", () => {
        populateAnalysis();
        updateExpenseInsights(getExpensesInRange());
    });
}

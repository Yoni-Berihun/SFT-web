document.addEventListener("DOMContentLoaded", () => {
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    // Initialize modal with close handlers
    const modal = App.initModal();

    let user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    let expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
    let splitFriends = App.loadState(App.STORAGE_KEYS.friends, App.defaultSplitFriends);
    let splitExpenses = App.loadState(App.STORAGE_KEYS.split, App.defaultSplitExpenses);
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
        } else if (currentRange === "custom" && customFrom && customTo) {
            start = customFrom;
            end = customTo;
        } else {
            // Fallback to all data
            return expenses.slice();
        }

        return expenses.filter((expense) => {
            const date = new Date(expense.date);
            return date >= start && date <= end;
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

    const populateProfile = () => {
        const nameEl = App.qs('[data-key="profileName"]');
        const emailEl = App.qs('[data-key="profileEmail"]');
        const avatar = App.qs(".avatar");
        const budgetInput = App.qs("#profileBudget");
        const currencySelect = App.qs("#profileCurrency");
        const notificationToggle = App.qs("#profileNotifications");

        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (avatar) avatar.dataset.initial = user.name.charAt(0).toUpperCase();
        if (budgetInput) budgetInput.value = user.budget;
        if (currencySelect) currencySelect.value = user.currency;
        if (notificationToggle) notificationToggle.checked = user.notifications;
    };

    const populateSplit = () => {
        const balanceList = App.qs("#balanceList");
        const expenseList = App.qs("#splitExpenses");
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
            item.textContent = `${friend.avatar} ${friend.name} ${prefix} ${App.formatCurrency(Math.abs(amount), user.currency)}`;
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
            item.textContent = `${expense.description} — ${App.formatCurrency(expense.totalAmount, user.currency)} (paid by ${paidBy})`;
            expenseList.appendChild(item);
        });
    };

    const updateAll = () => {
        updateHero();
        populateExpensesTable();
        populateAnalysis();
        populateProfile();
        populateSplit();
    };

    const openModal = (expense) => {
        const dateInput = App.qs("#expenseDate");
        const amountInput = App.qs("#expenseAmount");
        const categoryInput = App.qs("#expenseCategory");
        const notesInput = App.qs("#expenseNotes");

        if (expense) {
            editingId = expense.id;
            if (dateInput) dateInput.value = expense.date;
            if (amountInput) amountInput.value = expense.amount;
            if (categoryInput) categoryInput.value = expense.category;
            if (notesInput) notesInput.value = expense.notes;
        } else {
            editingId = null;
            if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
            if (amountInput) amountInput.value = "";
            if (categoryInput) categoryInput.value = "Food";
            if (notesInput) notesInput.value = "";
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
        const header = ["Date", "Category", "Amount", "Notes"];
        const lines = expenses.map((expense) => {
            const safeNotes = (expense.notes || "").replace(/"/g, '""');
            return [expense.date, expense.category, expense.amount, safeNotes]
                .map((value) => `"${value}"`)
                .join(",");
        });
        const csv = [header.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "expenses.csv";
        anchor.click();
        URL.revokeObjectURL(url);
        App.showToast("CSV exported");
    };

    const exportPdf = () => {
        window.print();
        App.showToast("Use browser print dialog to save as PDF");
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

    const handleProfileSave = () => {
        const budgetInput = App.qs("#profileBudget");
        const currencySelect = App.qs("#profileCurrency");
        const notificationToggle = App.qs("#profileNotifications");

        user = {
            ...user,
            budget: parseFloat(budgetInput.value || "0") || App.defaultUser.budget,
            currency: currencySelect.value,
            notifications: notificationToggle.checked,
        };

        App.saveState(App.STORAGE_KEYS.user, user);
        updateAll();
        App.showToast("Profile updated");
    };

    const clearDemoData = () => {
        user = App.clone(App.defaultUser);
        expenses = App.clone(App.defaultExpenses);
        splitFriends = App.clone(App.defaultSplitFriends);
        splitExpenses = App.clone(App.defaultSplitExpenses);
        App.saveState(App.STORAGE_KEYS.user, user);
        App.saveState(App.STORAGE_KEYS.expenses, expenses);
        App.saveState(App.STORAGE_KEYS.friends, splitFriends);
        App.saveState(App.STORAGE_KEYS.split, splitExpenses);
        window.dispatchEvent(new Event("expensesUpdated"));
        updateAll();
        App.showToast("Demo data restored");
    };

    const initDateRangeControls = () => {
        const chips = Array.from(document.querySelectorAll(".date-range-toggle .chip"));
        const customRow = App.qs(".date-range-custom");
        const fromInput = App.qs("#customFrom");
        const toInput = App.qs("#customTo");
        const applyBtn = App.qs("#applyCustomRange");

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                const range = chip.getAttribute("data-range");
                currentRange = range;
                chips.forEach((c) => {
                    c.classList.toggle("chip-active", c === chip);
                    c.setAttribute("aria-selected", c === chip ? "true" : "false");
                });
                if (range === "custom") {
                    customRow.hidden = false;
                } else {
                    customRow.hidden = true;
                    customFrom = null;
                    customTo = null;
                    updateAll();
                }
            });
        });

        applyBtn?.addEventListener("click", () => {
            if (fromInput.value && toInput.value) {
                customFrom = new Date(fromInput.value);
                customTo = new Date(toInput.value);
                currentRange = "custom";
                updateAll();
            } else {
                App.showToast("Select both start and end dates");
            }
        });
    };

    const initEvents = () => {
        App.qs("#openModal")?.addEventListener("click", () => openModal());
        App.qs("#fab")?.addEventListener("click", () => openModal());
        App.qs("#expenseForm")?.addEventListener("submit", handleExpenseSubmit);
        App.qs("#expenseRows")?.addEventListener("click", handleExpenseAction);
        App.qs("#exportCsv")?.addEventListener("click", exportCsv);
        App.qs("#exportPdf")?.addEventListener("click", exportPdf);
        App.qs("#analysisShare")?.addEventListener("click", shareAnalysis);
        App.qs("#profileSave")?.addEventListener("click", handleProfileSave);
        App.qs("#clearData")?.addEventListener("click", clearDemoData);
        App.qs("#categoryFilter")?.addEventListener("change", (event) => {
            filteredCategory = event.target.value;
            populateExpensesTable();
        });

        initDateRangeControls();
        bindExpenseChips();
    };

    const GOALS_KEY = "edufinance-goals";
    const DEFAULT_GOALS = [
        { id: "goal-log", label: "Log every expense the day it happens", completed: false },
        { id: "goal-budget", label: "Stay under 80% of budget", completed: false },
        { id: "goal-savings", label: "Add at least one savings entry", completed: false },
    ];

    let goalsState = App.loadState(GOALS_KEY, DEFAULT_GOALS);

    const renderGoals = () => {
        const list = App.qs("#goalsList");
        const summary = App.qs("#goalsSummary");
        if (!list || !summary) return;

        list.innerHTML = "";
        goalsState.forEach((goal) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <label>
                    <input type="checkbox" data-goal-id="${goal.id}" ${goal.completed ? "checked" : ""} />
                    ${goal.label}
                </label>
            `;
            list.appendChild(li);
        });

        const completed = goalsState.filter((goal) => goal.completed).length;
        summary.textContent = `${completed} of ${goalsState.length} complete`;

        list.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                const id = checkbox.dataset.goalId;
                goalsState = goalsState.map((goal) =>
                    goal.id === id ? { ...goal, completed: checkbox.checked } : goal
                );
                App.saveState(GOALS_KEY, goalsState);
                renderGoals();
            });
        });
    };

    const attachGoalButtons = () => {
        App.qs("#addGoal")?.addEventListener("click", () => {
            const label = prompt("Add a weekly focus:");
            if (!label || !label.trim()) return;
            const newGoal = {
                id: `goal-${Date.now()}`,
                label: label.trim(),
                completed: false,
            };
            goalsState = [...goalsState, newGoal];
            App.saveState(GOALS_KEY, goalsState);
            addActivity?.(`Added weekly goal: ${label.trim()}`);
            renderGoals();
        });

        App.qs("#resetGoals")?.addEventListener("click", () => {
            goalsState = DEFAULT_GOALS.map((goal) => ({ ...goal }));
            App.saveState(GOALS_KEY, goalsState);
            addActivity?.("Reset weekly goals");
            renderGoals();
        });
    };

    let activityLog = App.loadState("edufinance-activity", []);

    const addActivity = (message) => {
        const entry = {
            id: Date.now(),
            message,
            timestamp: new Date().toISOString(),
        };
        activityLog = [entry, ...activityLog].slice(0, 10);
        App.saveState("edufinance-activity", activityLog);
        renderActivityFeed();
    };

    const renderActivityFeed = () => {
        const feed = App.qs("#activityFeed");
        if (!feed) return;
        feed.innerHTML = "";
        if (!activityLog.length) {
            feed.innerHTML = "<li>No activity yet</li>";
            return;
        }
        activityLog.forEach((item) => {
            const li = document.createElement("li");
            const date = new Date(item.timestamp).toLocaleString();
            li.innerHTML = `<span>${item.message}</span><small>${date}</small>`;
            feed.appendChild(li);
        });
    };

    populateTips();
    populateProfile();
    populateSplit();
    populateAnalysis();
    updateAll();
    renderGoals();
    attachGoalButtons();
    renderActivityFeed();
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
});

document.addEventListener("DOMContentLoaded", () => {
    App.initTheme();

    const session = App.loadState(App.STORAGE_KEYS.session, { isAuthenticated: false });
    if (!session?.isAuthenticated) {
        window.location.href = "login.html";
        return;
    }

    const mobileToggle = document.getElementById("mobileToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    mobileToggle?.addEventListener("click", () => {
        const expanded = mobileToggle.getAttribute("aria-expanded") === "true";
        mobileToggle.setAttribute("aria-expanded", (!expanded).toString());
        mobileMenu?.toggleAttribute("hidden");
    });

    document.querySelectorAll('a[href^="#"]')?.forEach((link) => {
        link.addEventListener("click", () => {
            if (!mobileMenu) return;
            mobileMenu.setAttribute("hidden", "");
            mobileToggle?.setAttribute("aria-expanded", "false");
        });
    });

    const performLogout = () => {
        App.removeState(App.STORAGE_KEYS.session);
        App.showToast("Logged out");
        setTimeout(() => (window.location.href = "login.html"), 300);
    };

    const logoutButton = document.getElementById("logout");
    logoutButton?.addEventListener("click", performLogout);
    document.getElementById("logoutMobile")?.addEventListener("click", performLogout);

    let user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    let expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
    let splitFriends = App.loadState(App.STORAGE_KEYS.friends, App.defaultSplitFriends);
    let splitExpenses = App.loadState(App.STORAGE_KEYS.split, App.defaultSplitExpenses);
    let editingId = null;
    let filteredCategory = "all";

    const statusPill = App.qs("[data-key=\"statusPill\"]");

    const updateHero = () => {
        const stats = App.calculateStats(expenses);
        const total = stats.total;
        const remaining = Math.max(user.budget - total, 0);
        const progressPercent = user.budget ? Math.min(Math.round((total / user.budget) * 100), 100) : 0;

        App.qs('[data-key="totalSpent"]').textContent = App.formatCurrency(total, user.currency);
        App.qs('[data-key="remainingBudget"]').textContent = App.formatCurrency(remaining, user.currency);
        App.qs('[data-key="transactionCount"]').textContent = expenses.length.toString();

        const progressBar = App.qs('[data-key="budgetProgress"]');
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }

        App.qs('[data-key="progressSpent"]').textContent = App.formatCurrency(total, user.currency);
        App.qs('[data-key="progressBudget"]').textContent = App.formatCurrency(user.budget, user.currency);

        const status = progressPercent > 95 ? "Over budget" : progressPercent > 80 ? "Monitor" : "On track";
        if (statusPill) {
            statusPill.textContent = status;
            statusPill.classList.toggle("btn-danger", status === "Over budget");
        }

        App.qs('[data-key="avgDaily"]').textContent = App.formatCurrency(stats.averageDaily, user.currency);
    };

    const renderExpenseRow = (expense) => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.dataset.id = expense.id;
        row.innerHTML = `
            <span>${expense.date}</span>
            <span>${expense.category}</span>
            <span class="align-right">${App.formatCurrency(expense.amount, user.currency)}</span>
            <span>${expense.notes}</span>
            <span class="align-right">
                <button class="btn btn-ghost" data-action="edit">Edit</button>
                <button class="btn btn-ghost" data-action="delete">Delete</button>
            </span>
        `;
        return row;
    };

    const getFilteredExpenses = () => {
        if (filteredCategory === "all") return expenses.slice();
        return expenses.filter((expense) => expense.category === filteredCategory);
    };

    const populateExpensesTable = () => {
        const container = App.qs("#expenseRows");
        if (!container) return;
        container.innerHTML = "";
        const source = getFilteredExpenses()
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!source.length) {
            const empty = document.createElement("div");
            empty.className = "table-row";
            empty.innerHTML = "<span>No expenses yet</span>";
            container.appendChild(empty);
            return;
        }

        source.forEach((expense) => container.appendChild(renderExpenseRow(expense)));
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
        const topList = App.qs("#topCategories");
        const totalEl = App.qs('[data-key="analysisTotal"]');
        const avgEl = App.qs('[data-key="analysisAverage"]');
        const chart = App.qs("#dailyTotals");
        const stats = App.calculateStats(expenses);

        totalEl.textContent = App.formatCurrency(stats.total, user.currency);
        avgEl.textContent = App.formatCurrency(stats.averageDaily, user.currency);

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
                bar.title = `${date.toLocaleDateString(undefined, { weekday: "short" })}: ${App.formatCurrency(dayTotal, user.currency)}`;
                chart.appendChild(bar);
            }
        }
    };

    const populateTips = () => {
        const container = App.qs("#tipsList");
        if (!container) return;
        container.innerHTML = "";
        App.defaultTips.forEach((tip) => {
            const card = document.createElement("article");
            card.className = "tip-card";
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
        const overlay = App.qs("#modalOverlay");
        if (!overlay) return;
        overlay.hidden = false;
        const dateInput = App.qs("#expenseDate");
        const amountInput = App.qs("#expenseAmount");
        const categoryInput = App.qs("#expenseCategory");
        const notesInput = App.qs("#expenseNotes");

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
        const overlay = App.qs("#modalOverlay");
        if (!overlay) return;
        overlay.hidden = true;
        editingId = null;
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
            App.showToast("Expense removed");
            updateAll();
        }
    };

    const exportCsv = () => {
        const header = ["Date", "Category", "Amount", "Notes"];
        const lines = expenses.map((expense) => {
            return [expense.date, expense.category, expense.amount, expense.notes.replace(/"/g, '""')]
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
        const stats = App.calculateStats(expenses);
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
        updateAll();
        App.showToast("Demo data restored");
    };

    const initEvents = () => {
        App.qs("#openModal")?.addEventListener("click", () => openModal());
        App.qs("#modalClose")?.addEventListener("click", closeModal);
        App.qs("#modalCancel")?.addEventListener("click", closeModal);
        App.qs("#modalOverlay")?.addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeModal();
        });
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
    };

    populateTips();
    populateProfile();
    populateSplit();
    populateAnalysis();
    updateAll();
    initEvents();
});

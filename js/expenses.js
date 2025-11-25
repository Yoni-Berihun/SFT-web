document.addEventListener("DOMContentLoaded", () => {
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    // Initialize modal with close handlers
    const modal = App.initModal();

    const elements = {
        tableBody: document.getElementById("expensesTableBody"),
        total: document.getElementById("expensesTotal"),
        average: document.getElementById("expensesAverage"),
        count: document.getElementById("expensesCount"),
        categoryFilter: document.getElementById("filterCategory"),
        searchFilter: document.getElementById("searchExpenses"),
        dateFilter: document.getElementById("filterDate"),
        resetFilters: document.getElementById("resetFilters"),
        refresh: document.getElementById("refreshExpenses"),
        exportCsv: document.getElementById("exportExpensesCsv"),
        addButton: document.getElementById("addExpenseButton"),
        modalOverlay: document.getElementById("modalOverlay"),
        modalForm: document.getElementById("expensesModalForm"),
        modalClose: document.getElementById("modalClose"),
        modalCancel: document.getElementById("modalCancel"),
        modalDate: document.getElementById("modalDate"),
        modalCategory: document.getElementById("modalCategory"),
        modalAmount: document.getElementById("modalAmount"),
        modalNotes: document.getElementById("modalNotes"),
    };

    let user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    let expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
    let filters = {
        category: "all",
        search: "",
        date: "",
    };
    let editingId = null;

    const formatAmount = (amount) => App.formatCurrency(amount, user.currency);

    const applyFilters = () => {
        return expenses
            .slice()
            .filter((expense) => {
                if (filters.category !== "all" && expense.category !== filters.category) return false;
                if (filters.date && expense.date !== filters.date) return false;
                if (filters.search) {
                    const haystack = `${expense.notes} ${expense.category}`.toLowerCase();
                    if (!haystack.includes(filters.search.toLowerCase())) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const updateMetrics = (source) => {
        const total = source.reduce((sum, expense) => sum + expense.amount, 0);
        const average = source.length ? total / source.length : 0;
        if (elements.total) elements.total.textContent = formatAmount(total);
        if (elements.average) elements.average.textContent = formatAmount(average);
        if (elements.count) elements.count.textContent = source.length.toString();
    };

    const renderTable = () => {
        if (!elements.tableBody) return;
        const filtered = applyFilters();
        elements.tableBody.innerHTML = "";
        if (!filtered.length) {
            const empty = document.createElement("div");
            empty.className = "table-row";
            empty.innerHTML = "<span>No expenses match the filters.</span>";
            elements.tableBody.appendChild(empty);
        } else {
            filtered.forEach((expense) => {
                const row = document.createElement("div");
                row.className = "table-row";
                row.dataset.id = expense.id;
                row.innerHTML = `
                    <span>${expense.date}</span>
                    <span>${expense.category}</span>
                    <span class="align-right">${formatAmount(expense.amount)}</span>
                    <span>${expense.notes}</span>
                    <span class="align-right table-actions">
                        <button class="action-chip action-chip--edit" data-action="edit">Edit</button>
                        <button class="action-chip action-chip--delete" data-action="delete">Delete</button>
                    </span>
                `;
                elements.tableBody.appendChild(row);
            });
        }
        updateMetrics(filtered);
    };

    const openModal = (expense) => {
        editingId = expense?.id ?? null;
        const today = new Date().toISOString().split("T")[0];
        if (elements.modalDate) elements.modalDate.value = expense?.date || today;
        if (elements.modalCategory) elements.modalCategory.value = expense?.category || "Food";
        if (elements.modalAmount) elements.modalAmount.value = expense?.amount || "";
        if (elements.modalNotes) elements.modalNotes.value = expense?.notes || "";
        modal.open();
        if (elements.modalDate) elements.modalDate.focus();
    };

    const closeModal = () => {
        editingId = null;
        modal.close();
    };

    const handleTableClick = (event) => {
        const action = event.target.dataset.action;
        if (!action) return;
        const row = event.target.closest(".table-row");
        if (!row) return;
        const expense = expenses.find((item) => item.id === row.dataset.id);
        if (!expense) return;
        if (action === "edit") {
            openModal(expense);
        } else if (action === "delete") {
            expenses = expenses.filter((item) => item.id !== expense.id);
            App.saveState(App.STORAGE_KEYS.expenses, expenses);
            App.showToast("Expense deleted");
            renderTable();
            window.dispatchEvent(new CustomEvent("expensesUpdated"));
        }
    };

    const handleModalSubmit = (event) => {
        event.preventDefault();
        const payload = {
            id: editingId || `exp-${Date.now()}`,
            date: elements.modalDate.value,
            category: elements.modalCategory.value,
            amount: parseFloat(elements.modalAmount.value || "0"),
            notes: elements.modalNotes.value.trim() || "Expense",
        };
        if (!payload.amount || payload.amount <= 0) {
            App.showToast("Enter a valid amount");
            return;
        }
        if (editingId) {
            expenses = expenses.map((item) => (item.id === editingId ? payload : item));
            App.showToast("Expense updated");
        } else {
            expenses = [...expenses, payload];
            App.showToast("Expense added");
        }
        App.saveState(App.STORAGE_KEYS.expenses, expenses);
        closeModal();
        renderTable();
        window.dispatchEvent(new CustomEvent("expensesUpdated"));
    };

    const exportCsv = () => {
        const rows = applyFilters();
        if (!rows.length) {
            App.showToast("Nothing to export");
            return;
        }
        const header = ["Date", "Category", "Amount", "Notes"];
        const body = rows.map((expense) =>
            [expense.date, expense.category, expense.amount, expense.notes].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
        );
        const csv = [header.join(","), ...body].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "expenses.csv";
        link.click();
        URL.revokeObjectURL(url);
        App.showToast("CSV exported");
    };

    const bindFilterInputs = () => {
        elements.categoryFilter?.addEventListener("change", (event) => {
            filters.category = event.target.value;
            renderTable();
        });
        elements.searchFilter?.addEventListener("input", (event) => {
            filters.search = event.target.value;
            renderTable();
        });
        elements.dateFilter?.addEventListener("change", (event) => {
            filters.date = event.target.value;
            renderTable();
        });
        elements.resetFilters?.addEventListener("click", () => {
            filters = { category: "all", search: "", date: "" };
            if (elements.categoryFilter) elements.categoryFilter.value = "all";
            if (elements.searchFilter) elements.searchFilter.value = "";
            if (elements.dateFilter) elements.dateFilter.value = "";
            renderTable();
        });
    };

    const bindModalEvents = () => {
        elements.addButton?.addEventListener("click", () => openModal());
        elements.modalForm?.addEventListener("submit", handleModalSubmit);
    };

    elements.refresh?.addEventListener("click", () => {
        expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
        renderTable();
        App.showToast("Expenses refreshed");
    });

    elements.exportCsv?.addEventListener("click", exportCsv);
    elements.tableBody?.addEventListener("click", handleTableClick);

    bindFilterInputs();
    bindModalEvents();
    renderTable();
});


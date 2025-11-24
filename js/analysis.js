document.addEventListener("DOMContentLoaded", () => {
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    // Initialize modal with close handlers
    const modal = App.initModal();

    const selectors = {
        total: document.getElementById("analysisTotal"),
        average: document.getElementById("analysisAverage"),
        topCategory: document.getElementById("analysisTopCategory"),
        topCategoryShare: document.getElementById("analysisTopCategoryShare"),
        rangeSelect: document.getElementById("analysisRange"),
        categorySelect: document.getElementById("analysisCategory"),
        startInput: document.getElementById("analysisStart"),
        endInput: document.getElementById("analysisEnd"),
        resetButton: document.getElementById("analysisReset"),
        shareButton: document.getElementById("analysisShare"),
        exportCsvButton: document.getElementById("analysisExportCsv"),
        exportPdfButton: document.getElementById("analysisExportPdf"),
        refreshButton: document.getElementById("analysisRefresh"),
        dailyChart: document.getElementById("analysisDailyChart"),
        dailyChartCanvas: document.getElementById("analysisDailyChartCanvas"),
        categoryChart: document.getElementById("analysisCategoryChart"),
        categoryChartCanvas: document.getElementById("analysisCategoryChartCanvas"),
        logList: document.getElementById("analysisLog"),
    };

    let expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
    const user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);

    const getRange = () => {
        const rangeDays = Number(selectors.rangeSelect.value || 7);
        const end = selectors.endInput.value ? new Date(selectors.endInput.value) : new Date();
        const start = selectors.startInput.value ? new Date(selectors.startInput.value) : new Date(end.getTime() - (rangeDays - 1) * 86400000);
        return { start, end };
    };

    const filterExpenses = () => {
        const { start, end } = getRange();
        const category = selectors.categorySelect.value;
        return expenses.filter((expense) => {
            const date = new Date(expense.date);
            if (date < start || date > end) return false;
            if (category !== "all" && expense.category !== category) return false;
            return true;
        });
    };

    const renderMetrics = (source) => {
        const total = source.reduce((sum, expense) => sum + expense.amount, 0);
        const days = source.length ? source.length : 1;
        const average = source.length ? total / days : 0;
        const totalsByCategory = source.reduce((map, expense) => {
            map[expense.category] = (map[expense.category] || 0) + expense.amount;
            return map;
        }, {});
        const [topCategory, topValue] = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
        const share = total ? `${((topValue / total) * 100).toFixed(1)}% of spend` : "No data yet";

        selectors.total && (selectors.total.textContent = App.formatCurrency(total, user.currency));
        selectors.average && (selectors.average.textContent = App.formatCurrency(average, user.currency));
        selectors.topCategory && (selectors.topCategory.textContent = topCategory);
        selectors.topCategoryShare && (selectors.topCategoryShare.textContent = share);
    };

    let dailyChartInstance = null;
    let categoryChartInstance = null;

    const getTheme = () => document.documentElement.getAttribute("data-theme") || "light";
    const isDark = () => getTheme() === "dark";

    const renderDailyChart = (source) => {
        if (!selectors.dailyChartCanvas || typeof Chart === "undefined") return;
        const { start, end } = getRange();
        const days = [];
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            days.push(new Date(date));
        }
        const labels = days.map((date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
        const data = days.map((date) => {
            const dateKey = date.toISOString().split("T")[0];
            return source.filter((expense) => expense.date === dateKey).reduce((sum, expense) => sum + expense.amount, 0);
        });

        const ctx = selectors.dailyChartCanvas.getContext("2d");
        
        if (dailyChartInstance) dailyChartInstance.destroy();
        dailyChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Daily spending",
                    data,
                    backgroundColor: isDark() ? "rgba(39, 174, 96, 0.6)" : "rgba(39, 174, 96, 0.4)",
                    borderColor: isDark() ? "#27ae60" : "#1f8a4e",
                    borderWidth: 1,
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
                        ticks: { color: isDark() ? "#bdc3c7" : "#7f8c8d" },
                        grid: { color: isDark() ? "#3e5368" : "#e0e3e7" },
                    },
                    x: {
                        ticks: { color: isDark() ? "#bdc3c7" : "#7f8c8d" },
                        grid: { color: isDark() ? "#3e5368" : "#e0e3e7" },
                    },
                },
            },
        });
    };

    const renderCategoryChart = (source) => {
        if (!selectors.categoryChartCanvas || typeof Chart === "undefined") return;
        if (!source.length) {
            if (categoryChartInstance) {
                categoryChartInstance.destroy();
                categoryChartInstance = null;
            }
            return;
        }
        const totals = source.reduce((map, expense) => {
            map[expense.category] = (map[expense.category] || 0) + expense.amount;
            return map;
        }, {});
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const labels = sorted.map(([cat]) => cat);
        const data = sorted.map(([, val]) => val);
        const colors = ["#27ae60", "#f39c12", "#3498db", "#9b59b6", "#e74c3c"];

        const ctx = selectors.categoryChartCanvas.getContext("2d");
        
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctx, {
            type: "pie",
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderColor: isDark() ? "#34495e" : "#ffffff",
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: isDark() ? "#bdc3c7" : "#7f8c8d", padding: 12 },
                    },
                },
            },
        });
    };

    const renderLog = (source) => {
        if (!selectors.logList) return;
        selectors.logList.innerHTML = "";
        if (!source.length) {
            const empty = document.createElement("li");
            empty.textContent = "No spending captured in this range.";
            selectors.logList.appendChild(empty);
            return;
        }
        source
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8)
            .forEach((expense) => {
                const item = document.createElement("li");
                item.innerHTML = `<strong>${expense.date}</strong> — ${expense.category} · ${App.formatCurrency(expense.amount, user.currency)} · ${expense.notes}`;
                selectors.logList.appendChild(item);
            });
    };

    const renderAnalysis = () => {
        const filtered = filterExpenses();
        renderMetrics(filtered);
        renderDailyChart(filtered);
        renderCategoryChart(filtered);
        renderLog(filtered);
    };

    const resetFilters = () => {
        selectors.rangeSelect.value = "7";
        selectors.categorySelect.value = "all";
        selectors.startInput.value = "";
        selectors.endInput.value = "";
        renderAnalysis();
    };

    const exportCsv = () => {
        const rows = filterExpenses();
        if (!rows.length) {
            App.showToast("No data to export");
            return;
        }
        const header = ["Date", "Category", "Amount", "Notes"];
        const csv = [header.join(","), ...rows.map((row) => [row.date, row.category, row.amount, row.notes].join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "analysis.csv";
        link.click();
        URL.revokeObjectURL(url);
        App.showToast("CSV exported");
    };

    const shareSummary = () => {
        const rows = filterExpenses();
        const total = rows.reduce((sum, expense) => sum + expense.amount, 0);
        const summary = `EduFinance summary — ${rows.length} expenses totalling ${App.formatCurrency(total, user.currency)}.`;
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(summary)
                .then(() => App.showToast("Summary copied"))
                .catch(() => App.showToast("Clipboard unavailable"));
        } else {
            App.showToast("Clipboard unavailable");
        }
    };

    selectors.rangeSelect?.addEventListener("change", renderAnalysis);
    selectors.categorySelect?.addEventListener("change", renderAnalysis);
    selectors.startInput?.addEventListener("change", renderAnalysis);
    selectors.endInput?.addEventListener("change", renderAnalysis);
    selectors.resetButton?.addEventListener("click", resetFilters);
    selectors.exportCsvButton?.addEventListener("click", exportCsv);
    selectors.exportPdfButton?.addEventListener("click", () => window.print());
    selectors.shareButton?.addEventListener("click", shareSummary);
    selectors.refreshButton?.addEventListener("click", () => {
        expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
        renderAnalysis();
        App.showToast("Analysis refreshed");
    });

    window.addEventListener("themechange", () => {
        renderAnalysis();
    });
    
    window.addEventListener("expensesUpdated", () => {
        expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
        renderAnalysis();
    });

    renderAnalysis();
});


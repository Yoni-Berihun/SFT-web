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
        shareMenu: document.getElementById("analysisShareMenu"),
        categoryList: document.getElementById("analysisCategoryList"),
    };

    // Normalize any date-like value to a stable yyyy-mm-dd key (avoids timezone issues).
    const toDateKey = (value) => {
        const date = value instanceof Date ? value : new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const buildRecentSampleExpenses = () => {
        const today = new Date();
        return App.defaultExpenses.map((expense, index) => {
            const sampleDate = new Date(today);
            sampleDate.setDate(today.getDate() - (App.defaultExpenses.length - index));
            return {
                ...expense,
                id: `sample-${index}`,
                date: toDateKey(sampleDate),
            };
        });
    };

    let expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
    // Seed with helpful sample data for brand-new users so charts are never empty.
    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
        expenses = buildRecentSampleExpenses();
        App.saveState(App.STORAGE_KEYS.expenses, expenses);
        App.showToast("Loaded sample data. You can edit it from the Expenses page.");
    }
    const user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);

    const getRange = () => {
        const rangeDays = Number(selectors.rangeSelect.value || 7);
        const end = selectors.endInput.value ? new Date(selectors.endInput.value) : new Date();
        const start = selectors.startInput.value ? new Date(selectors.startInput.value) : new Date(end.getTime() - (rangeDays - 1) * 86400000);
        return { start, end };
    };

    // When we fall back to built‑in sample data, drive charts from that data’s own dates
    const getRangeFromSource = (source) => {
        if (!source.length) return getRange();
        const dates = source.map((e) => new Date(e.date));
        const min = new Date(Math.min.apply(null, dates));
        const max = new Date(Math.max.apply(null, dates));
        return { start: min, end: max };
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

    const updateCategoryList = (entries, total) => {
        if (!selectors.categoryList) return;
        selectors.categoryList.innerHTML = "";
        if (!entries.length || total <= 0) {
            const empty = document.createElement("li");
            empty.className = "category-table__empty";
            empty.textContent = "No category data yet.";
            selectors.categoryList.appendChild(empty);
            return;
        }
        entries.forEach(([category, amount]) => {
            const percent = Math.round((amount / total) * 100);
            const item = document.createElement("li");
            item.className = "category-row";
            item.innerHTML = `
                <span class="category-row__name">${category}</span>
                <span class="category-row__value">${App.formatCurrency(amount, user.currency)}</span>
                <span class="category-row__bar"><span style="width:${percent}%"></span></span>
            `;
            selectors.categoryList.appendChild(item);
        });
    };

    const renderDailyChart = (source, useSourceRange = false) => {
        if (!selectors.dailyChartCanvas || typeof Chart === "undefined") return;
        const { start, end } = useSourceRange ? getRangeFromSource(source) : getRange();
        const days = [];
        for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
            days.push(new Date(cursor));
        }
        const labels = days.map((date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
        const dailyData = days.map((date) => {
            const dateKey = toDateKey(date);
            return source
                .filter((expense) => toDateKey(expense.date) === dateKey)
                .reduce((sum, expense) => sum + expense.amount, 0);
        });
        let running = 0;
        const cumulativeData = dailyData.map((value) => {
            running += value;
            return Number(running.toFixed(2));
        });

        const ctx = selectors.dailyChartCanvas.getContext("2d");
        
        if (dailyChartInstance) dailyChartInstance.destroy();
        dailyChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Daily spending",
                        data: dailyData,
                        backgroundColor: (context) => {
                            const value = context.raw || 0;
                            const max = Math.max(...dailyData);
                            const base = isDark() ? "rgba(39, 174, 96," : "rgba(39, 174, 96,";
                            // Slightly highlight the busiest day
                            const alpha = value === max && max > 0 ? "0.85)" : isDark() ? "0.65)" : "0.45)";
                            return `${base}${alpha}`;
                        },
                        borderColor: isDark() ? "#27ae60" : "#1f8a4e",
                        borderWidth: 1.4,
                        borderRadius: 4,
                        hoverBorderWidth: 2,
                        yAxisID: "y",
                    },
                    {
                        type: "line",
                        label: "Running total",
                        data: cumulativeData,
                        borderColor: isDark() ? "#f5b041" : "#f39c12",
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHitRadius: 12,
                        yAxisID: "y1",
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 600,
                    easing: "easeOutCubic",
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        callbacks: {
                            label: (ctx) => {
                                const value = ctx.raw || 0;
                                const label = ctx.dataset.label || "";
                                return ` ${label}: ${App.formatCurrency(value, user.currency)}`;
                            },
                        },
                    },
                },
                hover: {
                    mode: "nearest",
                    intersect: true,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: isDark() ? "#bdc3c7" : "#7f8c8d" },
                        grid: { color: isDark() ? "#3e5368" : "#e0e3e7" },
                    },
                    y1: {
                        position: "right",
                        beginAtZero: true,
                        ticks: { color: isDark() ? "#f5b041" : "#f39c12" },
                        grid: { display: false },
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
        if (!selectors.categoryChartCanvas || typeof Chart === "undefined") {
            updateCategoryList([], 0);
            return;
        }
        if (!source.length) {
            if (categoryChartInstance) {
                categoryChartInstance.destroy();
                categoryChartInstance = null;
            }
            updateCategoryList([], 0);
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
        const totalAmount = Object.values(totals).reduce((sum, value) => sum + value, 0);

        updateCategoryList(sorted, totalAmount);

        const ctx = selectors.categoryChartCanvas.getContext("2d");
        
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: colors,
                        borderColor: isDark() ? "#0f172a" : "#ffffff",
                        borderWidth: 2,
                        hoverOffset: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "60%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: isDark() ? "#bdc3c7" : "#7f8c8d", padding: 12 },
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const label = ctx.label || "";
                                const value = ctx.raw || 0;
                                const percent = totalAmount ? ((value / totalAmount) * 100).toFixed(1) : "0.0";
                                return ` ${label}: ${App.formatCurrency(value, user.currency)} (${percent}%)`;
                            },
                        },
                    },
                },
                onClick: (_, elements) => {
                    const [first] = elements;
                    if (!first || !selectors.categorySelect) return;
                    const category = labels[first.index];
                    const option = Array.from(selectors.categorySelect.options).find((opt) => opt.value === category);
                    if (!option) return;
                    selectors.categorySelect.value = category;
                    renderAnalysis();
                    App.showToast(`Filtered by ${category}`);
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
        // Always show something: if current filters produce no rows, fall back to fresh system sample data
        const usingSample = filtered.length === 0;
        const source = usingSample ? buildRecentSampleExpenses() : filtered;

        renderMetrics(source);
        renderDailyChart(source, usingSample);
        renderCategoryChart(source);
        renderLog(source);
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

    const getShareSummary = (rows) => {
        const total = rows.reduce((sum, expense) => sum + expense.amount, 0);
        const totalsByCategory = rows.reduce((map, expense) => {
            map[expense.category] = (map[expense.category] || 0) + expense.amount;
            return map;
        }, {});
        const [topCategory, topValue] = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];
        const sharePercent = total ? `${((topValue / total) * 100).toFixed(1)}%` : "0%";
        const rangeLabel = `${selectors.rangeSelect?.selectedOptions?.[0]?.textContent || "custom range"}`;
        return `EduFinance summary — ${rows.length} expenses totaling ${App.formatCurrency(total, user.currency)} (${rangeLabel}). Top category: ${topCategory} (${sharePercent}).`;
    };

    const closeShareMenu = () => {
        if (selectors.shareMenu) selectors.shareMenu.hidden = true;
        if (selectors.shareButton) selectors.shareButton.setAttribute("aria-expanded", "false");
    };

    const toggleShareMenu = () => {
        if (!selectors.shareMenu || !selectors.shareButton) return;
        const willShow = selectors.shareMenu.hidden;
        selectors.shareMenu.hidden = !willShow;
        selectors.shareButton.setAttribute("aria-expanded", String(willShow));
    };

    const shareSummary = async (mode = "native") => {
        const rows = filterExpenses();
        if (!rows.length) {
            App.showToast("No data to share");
            closeShareMenu();
            return;
        }
        const summary = getShareSummary(rows);

        if (mode === "copy") {
            if (navigator.clipboard) {
                navigator.clipboard
                    .writeText(summary)
                    .then(() => App.showToast("Summary copied"))
                    .catch(() => App.showToast("Clipboard unavailable"));
            } else {
                App.showToast("Clipboard unavailable");
            }
            closeShareMenu();
            return;
        }

        if (mode === "email") {
            const subject = encodeURIComponent("EduFinance summary");
            const body = encodeURIComponent(summary);
            window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
            App.showToast("Email draft opened");
            closeShareMenu();
            return;
        }

        if (mode === "telegram") {
            const text = encodeURIComponent(summary);
            // Telegram will use current page URL plus text if supported
            window.open(`https://t.me/share/url?text=${text}`, "_blank");
            App.showToast("Opened Telegram share");
            closeShareMenu();
            return;
        }

        if (mode === "unigram") {
            const text = encodeURIComponent(summary);
            // Unigram is a Telegram client on Windows; try tg:// deep link first, then web
            window.location.href = `tg://msg?text=${text}`;
            App.showToast("Trying to open Unigram / Telegram");
            closeShareMenu();
            return;
        }

        if (mode === "whatsapp") {
            const text = encodeURIComponent(summary);
            window.open(`https://wa.me/?text=${text}`, "_blank");
            App.showToast("Opened WhatsApp share");
            closeShareMenu();
            return;
        }

        if (mode === "sms") {
            const body = encodeURIComponent(summary);
            // sms: works on mobile; desktop behavior depends on OS defaults
            window.location.href = `sms:?&body=${body}`;
            App.showToast("Opened Messages");
            closeShareMenu();
            return;
        }

        if (mode === "x") {
            const text = encodeURIComponent(summary);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
            App.showToast("Opened X / Twitter");
            closeShareMenu();
            return;
        }

        if (mode === "native" && navigator.share) {
            try {
                await navigator.share({
                    title: "EduFinance summary",
                    text: summary,
                });
                App.showToast("Shared successfully");
            } catch (error) {
                if (error.name !== "AbortError") {
                    App.showToast("Share unavailable");
                }
            }
        } else {
            App.showToast("System share unsupported, copied instead");
            if (navigator.clipboard) {
                navigator.clipboard.writeText(summary);
            }
        }
        closeShareMenu();
    };

    selectors.rangeSelect?.addEventListener("change", renderAnalysis);
    selectors.categorySelect?.addEventListener("change", renderAnalysis);
    selectors.startInput?.addEventListener("change", renderAnalysis);
    selectors.endInput?.addEventListener("change", renderAnalysis);
    selectors.resetButton?.addEventListener("click", resetFilters);
    selectors.exportCsvButton?.addEventListener("click", exportCsv);
    selectors.exportPdfButton?.addEventListener("click", () => window.print());
    selectors.shareButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleShareMenu();
    });
    selectors.shareMenu?.addEventListener("click", (event) => {
        const target = event.target.closest("[data-share]");
        const action = target?.dataset?.share;
        if (!action) return;
        event.stopPropagation();
        shareSummary(action);
    });
    document.addEventListener("click", (event) => {
        if (!selectors.shareMenu || selectors.shareMenu.hidden) return;
        if (event.target.closest(".share-control")) return;
        closeShareMenu();
    });
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


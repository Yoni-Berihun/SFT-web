let analysisPageInitialized = false;

const startAnalysisPage = () => {
    if (analysisPageInitialized) return;
    analysisPageInitialized = true;

    // Mark that we're not on an auth page
    window.__onAuthPage = false;
    
    const shellReady = window.App && typeof App.initPageShell === "function" ? App.initPageShell({ auth: true }) : false;
    if (shellReady === false) {
        console.warn("Analysis shell failed to init; retrying...");
        setTimeout(() => {
            analysisPageInitialized = false;
            startAnalysisPage();
        }, 120);
        return;
    }

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
        printButton: document.getElementById("analysisPrint"),
        refreshButton: document.getElementById("analysisRefresh"),
        dailyChart: document.getElementById("analysisDailyChart"),
        dailyChartCanvas: document.getElementById("analysisDailyChartCanvas"),
        categoryChart: document.getElementById("analysisCategoryChart"),
        categoryChartCanvas: document.getElementById("analysisCategoryChartCanvas"),
        logList: document.getElementById("analysisLog"),
        shareMenu: document.getElementById("analysisShareMenu"),
        categoryList: document.getElementById("analysisCategoryList"),
    };

    if (!shellReady) {
        console.warn("Analysis shell failed to init; running in fallback mode");
        App.showToast?.("Limited mode: some synced actions may be unavailable");
    }

    // Initialize modal with close handlers (fallback to no-op if unavailable)
    const modal = (App.initModal?.() ?? {
        open: () => {},
        close: () => {},
    });

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
        // Ensure chart canvas exists and is visible
        if (!selectors.dailyChartCanvas || typeof Chart === "undefined") {
            console.warn('Chart.js not loaded or canvas element not found');
            return;
        }
        
        // Show loading state
        selectors.dailyChartCanvas.style.display = 'none';
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Loading chart data...';
        loadingText.style.textAlign = 'center';
        loadingText.style.padding = '20px';
        loadingText.style.color = isDark() ? '#bdc3c7' : '#7f8c8d';
        
        const chartContainer = selectors.dailyChartCanvas.parentElement;
        if (chartContainer) {
            // Remove any existing loading text
            const existingLoading = chartContainer.querySelector('.chart-loading');
            if (existingLoading) {
                chartContainer.removeChild(existingLoading);
            }
            loadingText.className = 'chart-loading';
            chartContainer.appendChild(loadingText);
        }
        
        try {
            // Process data
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
            
            // If no data, show message
            if (dailyData.every(val => val === 0)) {
                if (chartContainer) {
                    loadingText.textContent = 'No data available for the selected range';
                }
                return;
            }
            
            // Calculate running total
            let running = 0;
            const cumulativeData = dailyData.map((value) => {
                running += value;
                return Number(running.toFixed(2));
            });

            // Remove loading text if it exists
            if (chartContainer) {
                const existingLoading = chartContainer.querySelector('.chart-loading');
                if (existingLoading) {
                    chartContainer.removeChild(existingLoading);
                }
            }
            
            // Show canvas
            selectors.dailyChartCanvas.style.display = 'block';
            
            const ctx = selectors.dailyChartCanvas.getContext("2d");
            
            // Destroy previous instance if exists
            if (dailyChartInstance) {
                dailyChartInstance.destroy();
            }
            
            // Create new chart instance
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
        } catch (error) {
            console.error("Failed to render daily chart", error);
            if (chartContainer) {
                loadingText.textContent = "Unable to load chart data";
            }
            App.showToast?.("Unable to render chart");
        } finally {
            if (chartContainer) {
                const existingLoading = chartContainer.querySelector(".chart-loading");
                if (existingLoading) {
                    chartContainer.removeChild(existingLoading);
                }
            }
            selectors.dailyChartCanvas.style.display = "block";
        }
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

    const exportPdf = async () => {
        const button = selectors.exportPdfButton;
        if (!button) {
            console.error("Export PDF button not found");
            App.showToast("Export PDF button not found");
            return;
        }
        
        // Save original button state
        const originalHTML = button.innerHTML;
        const originalDisabled = button.disabled;
        
        try {
            // Update button state
            button.disabled = true;
            button.innerHTML = 'Preparing PDF...';
            
            // Check if jsPDF is already loaded
            let jsPDFLib = null;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFLib = window.jspdf.jsPDF;
            } else if (window.jspdf) {
                jsPDFLib = window.jspdf;
            } else {
                // Try to load jsPDF library
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = () => {
                        // The library might expose itself differently
                        if (window.jspdf && window.jspdf.jsPDF) {
                            jsPDFLib = window.jspdf.jsPDF;
                        } else if (window.jspdf) {
                            jsPDFLib = window.jspdf;
                        } else {
                            reject(new Error('jsPDF library not loaded correctly'));
                            return;
                        }
                        resolve();
                    };
                    script.onerror = () => reject(new Error('Failed to load jsPDF library'));
                    document.head.appendChild(script);
                });
            }
            
            if (!jsPDFLib) {
                throw new Error('jsPDF library not available');
            }
            
            // Create a simple text-based PDF
            const pdf = new jsPDFLib();
            
            // Add title
            pdf.setFontSize(20);
            pdf.text('EduFinance Analysis Report', 14, 20);
            
            // Add date
            pdf.setFontSize(12);
            const date = new Date().toLocaleDateString();
            pdf.text(`Generated on: ${date}`, 14, 30);
            
            // Add a line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(14, 35, 200, 35);
            
            // Add summary data
            pdf.setFontSize(14);
            pdf.text('Expense Summary', 14, 45);
            
            // Get expense data
            const expenses = filterExpenses();
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            // Add summary text
            pdf.setFontSize(12);
            pdf.text(`Total Expenses: ${App.formatCurrency(total, user.currency)}`, 20, 55);
            pdf.text(`Number of Transactions: ${expenses.length}`, 20, 65);
            
            // Add transactions table
            if (expenses.length > 0) {
                pdf.text('Recent Transactions:', 14, 85);
                
                // Table headers
                pdf.setFont(undefined, 'bold');
                pdf.text('Date', 20, 95);
                pdf.text('Category', 60, 95);
                pdf.text('Amount', 120, 95);
                
                // Table rows
                pdf.setFont(undefined, 'normal');
                let y = 105;
                const itemsPerPage = 20;
                
                expenses.slice(0, 50).forEach((expense, index) => {
                    // Add new page if needed
                    if (index > 0 && index % itemsPerPage === 0) {
                        pdf.addPage();
                        y = 20;
                        
                        // Add headers on new page
                        pdf.setFont(undefined, 'bold');
                        pdf.text('Date', 20, y);
                        pdf.text('Category', 60, y);
                        pdf.text('Amount', 120, y);
                        
                        y += 10;
                        pdf.setFont(undefined, 'normal');
                    }
                    
                    pdf.text(expense.date, 20, y);
                    pdf.text(expense.category, 60, y);
                    pdf.text(App.formatCurrency(expense.amount, user.currency), 120, y);
                    
                    y += 8;
                    
                    // Add a small space after every 5 items
                    if (index > 0 && (index + 1) % 5 === 0) {
                        y += 5;
                    }
                });
            }
            
            // Add footer
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.text(
                    `Page ${i} of ${pageCount}`, 
                    pdf.internal.pageSize.getWidth() - 30,
                    pdf.internal.pageSize.getHeight() - 10
                );
            }
            
            // Save the PDF
            pdf.save(`EduFinance-Analysis-${new Date().toISOString().split('T')[0]}.pdf`);
            
            App.showToast('PDF exported successfully');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            App.showToast('Failed to generate PDF. Please try again.');
        } finally {
            // Restore button state
            if (button) {
                button.disabled = originalDisabled;
                button.innerHTML = originalHTML;
            }
        }
    };

    const printReport = () => {
        if (typeof window.print === "function") {
            App.showToast("Opening print dialog");
            window.print();
        } else {
            App.showToast("Print coming soon");
        }
    };

    // Set up all event listeners with error handling
    const setupEventListeners = () => {
        try {
            if (selectors.rangeSelect) {
                selectors.rangeSelect.addEventListener("change", renderAnalysis);
            } else {
                console.warn("analysisRange select not found");
            }

            if (selectors.categorySelect) {
                selectors.categorySelect.addEventListener("change", renderAnalysis);
            } else {
                console.warn("analysisCategory select not found");
            }

            if (selectors.startInput) {
                selectors.startInput.addEventListener("change", renderAnalysis);
            } else {
                console.warn("analysisStart input not found");
            }

            if (selectors.endInput) {
                selectors.endInput.addEventListener("change", renderAnalysis);
            } else {
                console.warn("analysisEnd input not found");
            }

            if (selectors.resetButton) {
                selectors.resetButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetFilters();
                });
            } else {
                console.warn("analysisReset button not found");
            }

            if (selectors.exportCsvButton) {
                selectors.exportCsvButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    exportCsv();
                });
            } else {
                console.error("analysisExportCsv button not found");
            }

            if (selectors.exportPdfButton) {
                selectors.exportPdfButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    exportPdf();
                });
            } else {
                console.error("analysisExportPdf button not found");
            }

            if (selectors.printButton) {
                selectors.printButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    printReport();
                });
            } else {
                console.error("analysisPrint button not found");
            }

            if (selectors.shareButton) {
                selectors.shareButton.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleShareMenu();
                });
            } else {
                console.warn("analysisShare button not found");
            }

            if (selectors.shareMenu) {
                selectors.shareMenu.addEventListener("click", (event) => {
                    const target = event.target.closest("[data-share]");
                    const action = target?.dataset?.share;
                    if (!action) return;
                    event.preventDefault();
                    event.stopPropagation();
                    shareSummary(action);
                });
            } else {
                console.warn("analysisShareMenu not found");
            }

            document.addEventListener("click", (event) => {
                if (!selectors.shareMenu || selectors.shareMenu.hidden) return;
                if (event.target.closest(".share-control")) return;
                closeShareMenu();
            });

            if (selectors.refreshButton) {
                selectors.refreshButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
                    renderAnalysis();
                    App.showToast("Analysis refreshed");
                });
            } else {
                console.warn("analysisRefresh button not found");
            }
        } catch (error) {
            console.error("Error setting up event listeners:", error);
            App.showToast?.("Some features may not work properly");
        }
    };

    setupEventListeners();

    window.addEventListener("themechange", () => {
        renderAnalysis();
    });
    
    window.addEventListener("expensesUpdated", () => {
        expenses = App.loadState(App.STORAGE_KEYS.expenses, App.defaultExpenses);
        renderAnalysis();
    });

    renderAnalysis();
};

const bootstrapAnalysisPage = () => {
    if (!window.App) {
        setTimeout(bootstrapAnalysisPage, 30);
        return;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startAnalysisPage, { once: true });
    } else {
        startAnalysisPage();
    }
};

bootstrapAnalysisPage();


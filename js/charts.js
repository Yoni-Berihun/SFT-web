<<<<<<< HEAD
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Register Chart.js plugins
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // Dynamic data computed from local storage (expenses and user profile)
    const monthlyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        income: [8500, 8200, 8800, 9000, 9200, 9500, 9800, 10000, 10200, 10500, 10800, 11000],
        expenses: new Array(12).fill(0),
    };

    // Dynamic category breakdown for top 5
    let expenseCategories = {
        labels: [],
        data: [],
        colors: ['#4285F4', '#FF6D00', '#9C27B0', '#00BFA5', '#FFD600']
    };

    const savingsData = {
        months: monthlyData.labels.slice(),
        amounts: new Array(12).fill(0)
    };

    let budgetData = {
        spent: 0,
        total: 0,
        percentage: 0
    };

    let financialHealthScore = 75; // Out of 100 (kept as-is for now)

    // Access stored data helper (supports environments where App may not be ready)
    const getStored = (key, fallback) => {
        if (window.App && typeof App.loadState === 'function') return App.loadState(key, fallback);
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    };

    const getUser = () => getStored(window?.App?.STORAGE_KEYS?.user || 'edufinance-user', window?.App?.defaultUser || { budget: 0, currency: 'Birr' });
    const getExpenses = () => getStored(window?.App?.STORAGE_KEYS?.expenses || 'edufinance-expenses', window?.App?.defaultExpenses || []);

    // Aggregate expenses into monthly and category buckets
    const computeAggregations = () => {
        const expenses = getExpenses() || [];
        // Reset
        monthlyData.expenses.fill(0);
        let totalSpent = 0;

        // Category totals
        const categoryTotals = {};
        expenses.forEach((exp) => {
            const date = new Date(exp.date);
            if (!isNaN(date)) {
                const month = date.getMonth();
                monthlyData.expenses[month] += Number(exp.amount) || 0;
            }
            const cat = (exp.category || 'Other').trim();
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(exp.amount) || 0);
            totalSpent += Number(exp.amount) || 0;
        });

        // Top 5 categories
        const sortedCats = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        expenseCategories.labels = sortedCats.map(([cat]) => cat);
        expenseCategories.data = sortedCats.map(([, amt]) => amt);

        // Budget calculations
        const user = getUser() || {};
        const budget = Number(user.budget) || 0;
        budgetData.spent = Math.max(0, totalSpent);
        budgetData.total = Math.max(0, budget);
        budgetData.percentage = budget > 0 ? Math.round((budgetData.spent / budget) * 100) : 0;
    };

    // Helper function to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-ET', { 
            style: 'currency', 
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // 1. Income vs Expenses Bar Chart
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    let incomeExpenseChartInstance = null;
    if (incomeExpenseCtx) {
        incomeExpenseChartInstance = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.income,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Expenses',
                        data: monthlyData.expenses,
                        backgroundColor: 'rgba(244, 67, 54, 0.7)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                    
                                    // Add percentage difference for income vs expenses
                                    if (context.datasetIndex === 1 && context.dataIndex > 0) {
                                        const prevIncome = monthlyData.income[context.dataIndex - 1];
                                        const currIncome = monthlyData.income[context.dataIndex];
                                        const prevExpense = monthlyData.expenses[context.dataIndex - 1];
                                        const currExpense = context.parsed.y;
                                        
                                        const incomeChange = ((currIncome - prevIncome) / prevIncome) * 100;
                                        const expenseChange = ((currExpense - prevExpense) / prevExpense) * 100;
                                        const diff = incomeChange - expenseChange;
                                        
                                        label += ` (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs income)`;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return 'ETB ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Expense breakdown chart instance
    let expenseBreakdownChartInstance = null;

    // 2. Expense Breakdown Donut Chart
    const expenseDonutCtx = document.getElementById('expenseDonutChart');
    if (expenseDonutCtx) {
        expenseBreakdownChartInstance = new Chart(expenseDonutCtx, {
            type: 'doughnut',
            data: {
                labels: expenseCategories.labels,
                datasets: [{
                    data: expenseCategories.data,
                    backgroundColor: expenseCategories.colors,
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend since we have custom legend
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        formatter: function(value, context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return percentage > 0 ? `${percentage}%` : '';
                        },
                        anchor: 'center',
                        align: 'center'
                    }
                },
                cutout: '70%',
                elements: {
                    arc: {
                        borderWidth: 0
                    }
                }
            }
        });
    }

    // 3. Savings Growth Line Chart
    const savingsGrowthCtx = document.getElementById('savingsGrowthChart');
    let savingsGrowthChartInstance = null;
    if (savingsGrowthCtx) {
        savingsGrowthChartInstance = new Chart(savingsGrowthCtx, {
            type: 'line',
            data: {
                labels: savingsData.months,
                datasets: [{
                    label: 'Savings',
                    data: savingsData.amounts,
                    borderColor: '#4285F4',
                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#4285F4',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 5000,
                                yMax: 5000,
                                borderColor: '#FF6D00',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: 'Milestone: 5,000 ETB',
                                    enabled: true,
                                    position: 'left',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    color: '#333',
                                    font: {
                                        weight: 'bold'
                                    },
                                    padding: 8,
                                    borderRadius: 4
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return 'ETB ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. Budget Utilization Radial Chart
    const budgetUtilizationCtx = document.getElementById('budgetUtilizationChart');
    let budgetUtilizationChartInstance = null;
    if (budgetUtilizationCtx) {
        budgetUtilizationChartInstance = new Chart(budgetUtilizationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Spent', 'Remaining'],
                datasets: [{
                    data: [budgetData.spent, Math.max(0, budgetData.total - budgetData.spent)],
                    backgroundColor: [
                        budgetData.percentage <= 70 ? '#4CAF50' : 
                        budgetData.percentage <= 90 ? '#FFC107' : '#F44336',
                        'rgba(0, 0, 0, 0.05)'
                    ],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: -90
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });

        // Add or update text in the center of the budget utilization chart
        const ensureCenterText = () => {
            const existing = budgetUtilizationCtx.parentNode.querySelector('.chart-center-text');
            const html = `
                <div class="percentage">${budgetData.percentage}%</div>
                <div class="label">Utilized</div>
                <div class="amount">${formatCurrency(budgetData.spent)}</div>
            `;
            if (existing) existing.innerHTML = html;
            else {
                const centerText = document.createElement('div');
                centerText.className = 'chart-center-text';
                centerText.innerHTML = html;
                budgetUtilizationCtx.parentNode.appendChild(centerText);
            }
        };
        ensureCenterText();
    }

    // 5. Financial Health Gauge Chart
    const financialHealthCtx = document.getElementById('financialHealthChart');
    if (financialHealthCtx) {
        new Chart(financialHealthCtx, {
            type: 'doughnut',
            data: {
                labels: ['Poor', 'Average', 'Good', 'Excellent'],
                datasets: [{
                    data: [25, 25, 25, 25], // Equal segments for the gauge
                    backgroundColor: [
                        '#F44336', // Red for Poor
                        '#FF9800', // Orange for Average
                        '#4CAF50', // Green for Good
                        '#2196F3'  // Blue for Excellent
                    ],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: -90
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });

        // Add needle to the gauge chart
        const addNeedleToGauge = () => {
            const canvas = financialHealthCtx;
            const centerX = canvas.width / 2;
            const centerY = canvas.height * 0.8; // Position the center higher for the gauge
            const radius = Math.min(canvas.width, canvas.height * 2) * 0.4;
            const angle = (financialHealthScore / 100) * Math.PI - Math.PI / 2; // Convert score to angle
            
            const ctx = canvas.getContext('2d');
            
            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw the gauge background
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI, true);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw the colored segments
            const segments = [
                { color: '#F44336', start: 0, end: 0.25 },
                { color: '#FF9800', start: 0.25, end: 0.5 },
                { color: '#4CAF50', start: 0.5, end: 0.75 },
                { color: '#2196F3', start: 0.75, end: 1 }
            ];
            
            segments.forEach(segment => {
                ctx.beginPath();
                ctx.arc(
                    centerX, 
                    centerY, 
                    radius - 1, 
                    Math.PI * segment.start, 
                    Math.PI * segment.end, 
                    false
                );
                ctx.strokeStyle = segment.color;
                ctx.lineWidth = 12;
                ctx.stroke();
            });
            
            // Draw the needle
            const needleLength = radius * 0.8;
            const needleWidth = 3;
            const x = centerX + Math.cos(angle) * needleLength;
            const y = centerY + Math.sin(angle) * needleLength;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // Needle
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(needleLength, 0);
            ctx.lineWidth = needleWidth;
            ctx.strokeStyle = '#333';
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Needle center dot
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            
            ctx.restore();
            
            // Add score text
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
            ctx.fillText(`${financialHealthScore}`, centerX, centerY - 30);
            
            // Add label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('Financial Health Score', centerX, centerY + 10);
            
            // Add status text
            let status = '';
            let statusColor = '';
            
            if (financialHealthScore < 40) {
                status = 'Needs Improvement';
                statusColor = '#F44336';
            } else if (financialHealthScore < 70) {
                status = 'Fair';
                statusColor = '#FF9800';
            } else if (financialHealthScore < 90) {
                status = 'Good';
                statusColor = '#4CAF50';
            } else {
                status = 'Excellent';
                statusColor = '#2196F3';
            }
            
            ctx.font = '600 16px Inter, sans-serif';
            ctx.fillStyle = statusColor;
            ctx.fillText(status, centerX, centerY + 40);
        };
        
        // Initial draw
        setTimeout(addNeedleToGauge, 500);
        
        // Redraw on window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                addNeedleToGauge();
            }, 250);
        });
    }

    // Handle theme changes for charts
    const handleThemeChange = () => {
        // Re-initialize charts when theme changes
        // This is a simple approach - in a real app, you might want to update chart options directly
        if (document.querySelector('.analytics-section')) {
            // Reload the page to re-render charts with new theme
            // This is a simple solution - in a production app, you'd update the chart options directly
            location.reload();
        }
    };

    // Update charts when data changes
    const updateAllCharts = () => {
        computeAggregations();
        // Update income/expense chart
        if (incomeExpenseChartInstance) {
            incomeExpenseChartInstance.data.datasets[1].data = monthlyData.expenses.slice();
            incomeExpenseChartInstance.update();
        }
        // Update breakdown chart
        if (expenseBreakdownChartInstance) {
            expenseBreakdownChartInstance.data.labels = expenseCategories.labels.slice();
            expenseBreakdownChartInstance.data.datasets[0].data = expenseCategories.data.slice();
            expenseBreakdownChartInstance.update();
        }
        // Update savings chart
        if (savingsGrowthChartInstance) {
            savingsGrowthChartInstance.data.datasets[0].data = savingsData.amounts.slice();
            savingsGrowthChartInstance.update();
        }
        // Update budget utilization
        if (budgetUtilizationChartInstance) {
            budgetUtilizationChartInstance.data.datasets[0].data = [budgetData.spent, Math.max(0, budgetData.total - budgetData.spent)];
            // Update color based on percentage
            budgetUtilizationChartInstance.data.datasets[0].backgroundColor[0] = budgetData.percentage <= 70 ? '#4CAF50' : (budgetData.percentage <= 90 ? '#FFC107' : '#F44336');
            budgetUtilizationChartInstance.update();
            // Update center text
            const existing = budgetUtilizationCtx?.parentNode?.querySelector('.chart-center-text');
            if (existing) {
                existing.innerHTML = `\n                    <div class="percentage">${budgetData.percentage}%</div>\n                    <div class="label">Utilized</div>\n                    <div class="amount">${formatCurrency(budgetData.spent)}</div>\n                `;
            }
        }

        // --- Update Category Mix legend (live percentages) ---
        try {
            const catTotal = expenseCategories.data.reduce((s, v) => s + v, 0) || 0;
            const legendUl = document.querySelector('.chart-legend');
            if (legendUl) {
                legendUl.innerHTML = '';
                expenseCategories.labels.slice(0, 7).forEach((label, idx) => {
                    const value = expenseCategories.data[idx] || 0;
                    const pct = catTotal > 0 ? Math.round((value / catTotal) * 100) : 0;
                    const color = expenseCategories.colors[idx] || '#ccc';
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="dot" style="background-color: ${color}"></span>${label} · ${pct}%`;
                    legendUl.appendChild(li);
                });
            }
            // Update the donut chart with new data
            if (expenseBreakdownChartInstance) {
                expenseBreakdownChartInstance.data.labels = expenseCategories.labels;
                expenseBreakdownChartInstance.data.datasets[0].data = expenseCategories.data;
                expenseBreakdownChartInstance.data.datasets[0].backgroundColor = expenseCategories.colors.slice(0, expenseCategories.labels.length);
                expenseBreakdownChartInstance.update();
            }

            // Update center with top category
            const center = document.querySelector('.donut-chart__center');
            if (center) {
                const maxIdx = expenseCategories.data.indexOf(Math.max(...expenseCategories.data)) || 0;
                const topLabel = expenseCategories.labels[maxIdx] || 'No Data';
                const topPct = expenseCategories.data.length > 0 ? Math.round((expenseCategories.data[maxIdx] / expenseCategories.data.reduce((a,b)=>a+b,0)) * 100) : 0;
                const strong = center.querySelector('strong');
                const span = center.querySelector('span');
                if (strong) strong.textContent = topLabel;
                if (span) span.textContent = `${topPct}%`;
            }
        } catch (err) {
            console.warn('Failed to update category legend', err);
        }

        // --- Weekly Pulse (today + percent vs yesterday) ---
        try {
            const expenses = getExpenses() || [];
            const toKey = (d) => d.toISOString().split('T')[0];
            const today = new Date();
            const todayKey = toKey(today);
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayKey = toKey(yesterday);
            const sumByDate = (key) => expenses.filter(e => (e.date || '').startsWith(key)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
            const todaySum = sumByDate(todayKey);
            const yesterdaySum = sumByDate(yesterdayKey);

            const pulseStrong = document.querySelectorAll('.pulse-stats strong');
            const pulseHelpers = document.querySelectorAll('.pulse-stats .helper-text');
            if (pulseStrong && pulseStrong.length > 0) {
                pulseStrong[0].textContent = formatCurrency(todaySum);
            }
            // percent change helper
            if (pulseHelpers && pulseHelpers.length > 0) {
                let text = '';
                if (yesterdaySum === 0) {
                    text = todaySum === 0 ? 'No change' : `↑ New today`;
                } else {
                    const diff = Math.round(((todaySum - yesterdaySum) / Math.max(1, yesterdaySum)) * 100);
                    text = `${diff > 0 ? '↑' : diff < 0 ? '↓' : 'Flat'} ${Math.abs(diff)}% vs yesterday`;
                }
                pulseHelpers[0].textContent = text;
            }

            // Safe-to-spend update (second strong in pulse-stats)
            const totalSpent = expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
            const user = getUser() || {};
            const budget = Number(user.budget) || 0;
            const remaining = Math.max(0, budget - totalSpent);
            if (pulseStrong && pulseStrong.length > 1) {
                pulseStrong[1].textContent = formatCurrency(remaining);
            }

            // Also update the highlight-card value (budget remaining)
            const budgetValueEl = document.querySelector('.highlight-card--accent .highlight-card__value');
            if (budgetValueEl) {
                budgetValueEl.textContent = `${formatCurrency(remaining)}`;
            }
            // Update the pulse SVG area & line based on last 9 days of spending
            try {
                const days = 9;
                const now = new Date();
                const daily = new Array(days).fill(0);
                expenses.forEach((e) => {
                    const d = new Date(e.date);
                    if (!isNaN(d)) {
                        const diff = Math.floor((now - d) / (24 * 60 * 60 * 1000));
                        if (diff >= 0 && diff < days) {
                            daily[days - 1 - diff] += Number(e.amount) || 0;
                        }
                    }
                });

                // Map daily values to SVG coordinates
                const maxVal = Math.max(...daily, 1);
                const width = 400;
                const height = 120; // max draw height
                const step = width / (days - 1);
                const points = daily.map((v, i) => {
                    const x = Math.round(i * step);
                    // invert so larger values go up (smaller y)
                    const y = Math.round(height - (v / maxVal) * (height - 20)) + 40; // shift to fit view
                    return { x, y };
                });

                const path = `M0,${points[0].y} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L400,160 L0,160 Z`;
                const poly = points.map(p => `${p.x},${p.y}`).join(' ');
                const pulseArea = document.querySelector('.pulse-area');
                const pulseLine = document.querySelector('.pulse-line');
                if (pulseArea) pulseArea.setAttribute('d', path);
                if (pulseLine) pulseLine.setAttribute('points', poly);
            } catch (err) {
                console.warn('Failed to update pulse SVG', err);
            }
        } catch (err) {
            console.warn('Failed to update weekly pulse or safe-to-spend', err);
        }

        // --- Upcoming reminders ---
        try {
            const reminders = [
                { date: 'Nov 26', title: 'Lab materials', amount: 350, note: 'Supplies' },
                { date: 'Nov 28', title: 'Library membership', amount: 150, note: 'Books' },
                { date: 'Nov 30', title: 'Gym renewal', amount: 220, note: 'Gym' },
                { date: 'Dec 01', title: 'Class trip deposit', amount: 600, note: 'Transport' },
            ];
            const expenses = getExpenses() || [];
            const timeline = document.querySelector('.timeline');
            if (timeline) {
                timeline.innerHTML = reminders.map((r) => {
                    // check if any expense mentions the reminder title
                    const matched = expenses.find(e => (e.description || e.notes || '').toLowerCase().includes(r.title.toLowerCase()));
                    const paidNote = matched ? `<p class="helper-text">Paid: ${formatCurrency(matched.amount)}</p>` : `<p class="helper-text">Expected ETB ${r.amount} · ${r.note}</p>`;
                    return `
                        <li>
                            <span>${r.date}</span>
                            <div>
                                <strong>${r.title}</strong>
                                ${paidNote}
                            </div>
                        </li>
                    `;
                }).join('');
            }
        } catch (err) {
            console.warn('Failed to update reminders', err);
        }

        // --- Smart suggestions (Cosmetics, Coffee, Gym) ---
        try {
            const expenses = getExpenses() || [];
            const now = new Date();
            const toKey = (d) => d.toISOString().split('T')[0];
            const withinDays = (d, days) => {
                const date = new Date(d);
                const diff = Math.floor((now - date) / (24 * 60 * 60 * 1000));
                return diff >= 0 && diff < days;
            };
            const sumForCategoryRange = (catKeyword, daysStart, daysEnd) => {
                // daysStart inclusive from now (0 means today), daysEnd exclusive
                return expenses.reduce((s, e) => {
                    try {
                        const ed = new Date(e.date);
                        const diffDays = Math.floor((now - ed) / (24 * 60 * 60 * 1000));
                        if (diffDays >= daysStart && diffDays < daysEnd) {
                            const desc = (e.category || e.notes || e.description || '').toLowerCase();
                            if (desc.includes(catKeyword.toLowerCase())) return s + (Number(e.amount) || 0);
                        }
                    } catch (e) {}
                    return s;
                }, 0);
            };

            const suggestionKeys = ['Cosmetics', 'Coffee', 'Gym'];
            const sparkCards = Array.from(document.querySelectorAll('.spark-grid .spark-card'));
            suggestionKeys.forEach((key, idx) => {
                const last7 = sumForCategoryRange(key, 0, 7);
                const prev7 = sumForCategoryRange(key, 7, 14);
                let display = 'Flat';
                if (prev7 === 0) {
                    if (last7 === 0) display = 'Flat';
                    else display = `↑ ${Math.round(100)}%`;
                } else {
                    const change = Math.round(((last7 - prev7) / Math.max(1, prev7)) * 100);
                    if (change > 0) display = `↑ ${Math.abs(change)}%`;
                    else if (change < 0) display = `↓ ${Math.abs(change)}%`;
                    else display = 'Flat';
                }
                if (sparkCards[idx]) {
                    const strong = sparkCards[idx].querySelector('strong');
                    if (strong) strong.textContent = display;
                }
            });
        } catch (err) {
            console.warn('Failed to update smart suggestions', err);
        }
    };

    // Wire updates to expense events
    window.addEventListener('expensesUpdated', () => {
        try {
            updateAllCharts();
        } catch (err) {
            console.warn('Failed to update charts on expensesUpdated', err);
        }
    });

    // Also update when the user profile changes in the same tab
    window.addEventListener('userUpdated', () => {
        try {
            updateAllCharts();
        } catch (err) {
            console.warn('Failed to update charts on userUpdated', err);
        }
    });

    // Also refresh when storage changes (other tabs)
    window.addEventListener('storage', (e) => {
        if (!e.key) return;
        if (e.key === (window?.App?.STORAGE_KEYS?.expenses || 'edufinance-expenses') || e.key === (window?.App?.STORAGE_KEYS?.user || 'edufinance-user')) {
            try {
                updateAllCharts();
            } catch (err) {
                console.warn('Failed to update charts on storage event', err);
            }
        }
    });

    // Initial compute to populate charts with stored data
    try {
        updateAllCharts();
    } catch (err) {
        console.warn('Failed initial chart update', err);
    }

    // Listen for theme changes
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Wait for theme to be toggled
            setTimeout(handleThemeChange, 100);
        });
    }

    // Initial theme check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
});
=======
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Dynamic data computed from local storage (expenses and user profile)
    const monthlyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        income: [8500, 8200, 8800, 9000, 9200, 9500, 9800, 10000, 10200, 10500, 10800, 11000],
        expenses: new Array(12).fill(0),
    };

    // Focused category mix for the UI: Food, Transport, Books, Lifestyle
    const expenseCategories = {
        labels: ['Food', 'Transport', 'Books', 'Lifestyle'],
        data: new Array(4).fill(0),
        colors: ['#4285F4', '#FF6D00', '#9C27B0', '#00BFA5']
    };

    const savingsData = {
        months: monthlyData.labels.slice(),
        amounts: new Array(12).fill(0)
    };

    let budgetData = {
        spent: 0,
        total: 0,
        percentage: 0
    };

    let financialHealthScore = 75; // Out of 100 (kept as-is for now)

    // Access stored data helper (supports environments where App may not be ready)
    const getStored = (key, fallback) => {
        if (window.App && typeof App.loadState === 'function') return App.loadState(key, fallback);
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    };

    const getUser = () => getStored(window?.App?.STORAGE_KEYS?.user || 'edufinance-user', window?.App?.defaultUser || { budget: 0, currency: 'Birr' });
    const getExpenses = () => getStored(window?.App?.STORAGE_KEYS?.expenses || 'edufinance-expenses', window?.App?.defaultExpenses || []);

    // Aggregate expenses into monthly and category buckets
    const computeAggregations = () => {
        const expenses = getExpenses() || [];
        // Reset
        monthlyData.expenses.fill(0);
        expenseCategories.data.fill(0);
        savingsData.amounts.fill(0);
        let totalSpent = 0;

        const normalizeCategory = (cat) => {
            const s = (cat || '').toLowerCase();
            if (s.includes('food')) return 'Food';
            if (s.includes('transport') || s.includes('bus') || s.includes('taxi')) return 'Transport';
            if (s.includes('book')) return 'Books';
            // Map common entertainment/supplies/etc to Lifestyle bucket
            return 'Lifestyle';
        };
        const categoryIndex = (cat) => {
            const mapped = normalizeCategory(cat);
            const idx = expenseCategories.labels.indexOf(mapped);
            return idx >= 0 ? idx : 0;
        };

        expenses.forEach((exp) => {
            const date = new Date(exp.date);
            if (!isNaN(date)) {
                const month = date.getMonth();
                monthlyData.expenses[month] += Number(exp.amount) || 0;
                // For savingsData we'll just mirror monthly expenses as negative savings placeholder
                savingsData.amounts[month] += 0; // keep existing placeholder behavior
            }
            const idx = categoryIndex(exp.category || 'Miscellaneous');
            expenseCategories.data[idx] += Number(exp.amount) || 0;
            totalSpent += Number(exp.amount) || 0;
        });

        // Budget calculations
        const user = getUser() || {};
        const budget = Number(user.budget) || 0;
        budgetData.spent = Math.max(0, totalSpent);
        budgetData.total = Math.max(0, budget);
        budgetData.percentage = budget > 0 ? Math.round((budgetData.spent / budget) * 100) : 0;

        // Ensure donut category data uses percentages or absolute values — keep absolute sums
    };

    // Helper function to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-ET', { 
            style: 'currency', 
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // 1. Income vs Expenses Bar Chart
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    let incomeExpenseChartInstance = null;
    if (incomeExpenseCtx) {
        incomeExpenseChartInstance = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.income,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Expenses',
                        data: monthlyData.expenses,
                        backgroundColor: 'rgba(244, 67, 54, 0.7)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                    
                                    // Add percentage difference for income vs expenses
                                    if (context.datasetIndex === 1 && context.dataIndex > 0) {
                                        const prevIncome = monthlyData.income[context.dataIndex - 1];
                                        const currIncome = monthlyData.income[context.dataIndex];
                                        const prevExpense = monthlyData.expenses[context.dataIndex - 1];
                                        const currExpense = context.parsed.y;
                                        
                                        const incomeChange = ((currIncome - prevIncome) / prevIncome) * 100;
                                        const expenseChange = ((currExpense - prevExpense) / prevExpense) * 100;
                                        const diff = incomeChange - expenseChange;
                                        
                                        label += ` (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs income)`;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return 'ETB ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Expense breakdown chart instance
    let expenseBreakdownChartInstance = null;

    // 2. Expense Breakdown Donut Chart
    const expenseBreakdownCtx = document.getElementById('expenseBreakdownChart');
    if (expenseBreakdownCtx) {
        expenseBreakdownChartInstance = new Chart(expenseBreakdownCtx, {
            type: 'doughnut',
            data: {
                labels: expenseCategories.labels,
                datasets: [{
                    data: expenseCategories.data,
                    backgroundColor: expenseCategories.colors,
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${percentage}% (${formatCurrency(value)})`;
                            }
                        }
                    }
                },
                cutout: '70%',
                elements: {
                    arc: {
                        borderWidth: 0
                    }
                }
            }
        });
    }

    // 3. Savings Growth Line Chart
    const savingsGrowthCtx = document.getElementById('savingsGrowthChart');
    let savingsGrowthChartInstance = null;
    if (savingsGrowthCtx) {
        savingsGrowthChartInstance = new Chart(savingsGrowthCtx, {
            type: 'line',
            data: {
                labels: savingsData.months,
                datasets: [{
                    label: 'Savings',
                    data: savingsData.amounts,
                    borderColor: '#4285F4',
                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#4285F4',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 5000,
                                yMax: 5000,
                                borderColor: '#FF6D00',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: 'Milestone: 5,000 ETB',
                                    enabled: true,
                                    position: 'left',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    color: '#333',
                                    font: {
                                        weight: 'bold'
                                    },
                                    padding: 8,
                                    borderRadius: 4
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return 'ETB ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. Budget Utilization Radial Chart
    const budgetUtilizationCtx = document.getElementById('budgetUtilizationChart');
    let budgetUtilizationChartInstance = null;
    if (budgetUtilizationCtx) {
        budgetUtilizationChartInstance = new Chart(budgetUtilizationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Spent', 'Remaining'],
                datasets: [{
                    data: [budgetData.spent, Math.max(0, budgetData.total - budgetData.spent)],
                    backgroundColor: [
                        budgetData.percentage <= 70 ? '#4CAF50' : 
                        budgetData.percentage <= 90 ? '#FFC107' : '#F44336',
                        'rgba(0, 0, 0, 0.05)'
                    ],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: -90
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });

        // Add or update text in the center of the budget utilization chart
        const ensureCenterText = () => {
            const existing = budgetUtilizationCtx.parentNode.querySelector('.chart-center-text');
            const html = `
                <div class="percentage">${budgetData.percentage}%</div>
                <div class="label">Utilized</div>
                <div class="amount">${formatCurrency(budgetData.spent)}</div>
            `;
            if (existing) existing.innerHTML = html;
            else {
                const centerText = document.createElement('div');
                centerText.className = 'chart-center-text';
                centerText.innerHTML = html;
                budgetUtilizationCtx.parentNode.appendChild(centerText);
            }
        };
        ensureCenterText();
    }

    // 5. Financial Health Gauge Chart
    const financialHealthCtx = document.getElementById('financialHealthChart');
    if (financialHealthCtx) {
        new Chart(financialHealthCtx, {
            type: 'doughnut',
            data: {
                labels: ['Poor', 'Average', 'Good', 'Excellent'],
                datasets: [{
                    data: [25, 25, 25, 25], // Equal segments for the gauge
                    backgroundColor: [
                        '#F44336', // Red for Poor
                        '#FF9800', // Orange for Average
                        '#4CAF50', // Green for Good
                        '#2196F3'  // Blue for Excellent
                    ],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: -90
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });

        // Add needle to the gauge chart
        const addNeedleToGauge = () => {
            const canvas = financialHealthCtx;
            const centerX = canvas.width / 2;
            const centerY = canvas.height * 0.8; // Position the center higher for the gauge
            const radius = Math.min(canvas.width, canvas.height * 2) * 0.4;
            const angle = (financialHealthScore / 100) * Math.PI - Math.PI / 2; // Convert score to angle
            
            const ctx = canvas.getContext('2d');
            
            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw the gauge background
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI, true);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw the colored segments
            const segments = [
                { color: '#F44336', start: 0, end: 0.25 },
                { color: '#FF9800', start: 0.25, end: 0.5 },
                { color: '#4CAF50', start: 0.5, end: 0.75 },
                { color: '#2196F3', start: 0.75, end: 1 }
            ];
            
            segments.forEach(segment => {
                ctx.beginPath();
                ctx.arc(
                    centerX, 
                    centerY, 
                    radius - 1, 
                    Math.PI * segment.start, 
                    Math.PI * segment.end, 
                    false
                );
                ctx.strokeStyle = segment.color;
                ctx.lineWidth = 12;
                ctx.stroke();
            });
            
            // Draw the needle
            const needleLength = radius * 0.8;
            const needleWidth = 3;
            const x = centerX + Math.cos(angle) * needleLength;
            const y = centerY + Math.sin(angle) * needleLength;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // Needle
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(needleLength, 0);
            ctx.lineWidth = needleWidth;
            ctx.strokeStyle = '#333';
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Needle center dot
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            
            ctx.restore();
            
            // Add score text
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
            ctx.fillText(`${financialHealthScore}`, centerX, centerY - 30);
            
            // Add label
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('Financial Health Score', centerX, centerY + 10);
            
            // Add status text
            let status = '';
            let statusColor = '';
            
            if (financialHealthScore < 40) {
                status = 'Needs Improvement';
                statusColor = '#F44336';
            } else if (financialHealthScore < 70) {
                status = 'Fair';
                statusColor = '#FF9800';
            } else if (financialHealthScore < 90) {
                status = 'Good';
                statusColor = '#4CAF50';
            } else {
                status = 'Excellent';
                statusColor = '#2196F3';
            }
            
            ctx.font = '600 16px Inter, sans-serif';
            ctx.fillStyle = statusColor;
            ctx.fillText(status, centerX, centerY + 40);
        };
        
        // Initial draw
        setTimeout(addNeedleToGauge, 500);
        
        // Redraw on window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                addNeedleToGauge();
            }, 250);
        });
    }

    // Handle theme changes for charts
    const handleThemeChange = () => {
        // Re-initialize charts when theme changes
        // This is a simple approach - in a real app, you might want to update chart options directly
        if (document.querySelector('.analytics-section')) {
            // Reload the page to re-render charts with new theme
            // This is a simple solution - in a production app, you'd update the chart options directly
            location.reload();
        }
    };

    // Update charts when data changes
    const updateAllCharts = () => {
        computeAggregations();
        // Update income/expense chart
        if (incomeExpenseChartInstance) {
            incomeExpenseChartInstance.data.datasets[1].data = monthlyData.expenses.slice();
            incomeExpenseChartInstance.update();
        }
        // Update breakdown chart
        if (expenseBreakdownChartInstance) {
            expenseBreakdownChartInstance.data.labels = expenseCategories.labels.slice();
            expenseBreakdownChartInstance.data.datasets[0].data = expenseCategories.data.slice();
            expenseBreakdownChartInstance.update();
        }
        // Update savings chart
        if (savingsGrowthChartInstance) {
            savingsGrowthChartInstance.data.datasets[0].data = savingsData.amounts.slice();
            savingsGrowthChartInstance.update();
        }
        // Update budget utilization
        if (budgetUtilizationChartInstance) {
            budgetUtilizationChartInstance.data.datasets[0].data = [budgetData.spent, Math.max(0, budgetData.total - budgetData.spent)];
            // Update color based on percentage
            budgetUtilizationChartInstance.data.datasets[0].backgroundColor[0] = budgetData.percentage <= 70 ? '#4CAF50' : (budgetData.percentage <= 90 ? '#FFC107' : '#F44336');
            budgetUtilizationChartInstance.update();
            // Update center text
            const existing = budgetUtilizationCtx?.parentNode?.querySelector('.chart-center-text');
            if (existing) {
                existing.innerHTML = `\n                    <div class="percentage">${budgetData.percentage}%</div>\n                    <div class="label">Utilized</div>\n                    <div class="amount">${formatCurrency(budgetData.spent)}</div>\n                `;
            }
        }

        // --- Update Category Mix legend (live percentages) ---
        try {
            const catTotal = expenseCategories.data.reduce((s, v) => s + v, 0) || 0;
            const legendItems = Array.from(document.querySelectorAll('.chart-legend li'));
            expenseCategories.labels.forEach((label, idx) => {
                const value = expenseCategories.data[idx] || 0;
                const pct = catTotal > 0 ? Math.round((value / catTotal) * 100) : 0;
                // Update chart legend lines if they exist (format: "Food · 38%")
                if (legendItems[idx]) {
                    legendItems[idx].textContent = `${label} · ${pct}%`;
                }
            });
            // Update the donut visual (conic-gradient) and center label
            const donut = document.querySelector('.donut-chart');
            if (donut) {
                const colors = expenseCategories.colors || ['#4285F4', '#FF6D00', '#9C27B0', '#00BFA5'];
                let acc = 0;
                const stops = expenseCategories.data.map((v, i) => {
                    const pct = catTotal > 0 ? (v / catTotal) * 100 : 0;
                    const start = acc;
                    acc += pct;
                    const end = acc;
                    return `${colors[i]} ${start}% ${end}%`;
                });
                // If total < 100, append a transparent remainder
                if (acc < 100) stops.push(`rgba(0,0,0,0.06) ${acc}% 100%`);
                donut.style.background = `conic-gradient(${stops.join(',')})`;

                // Update center with top category
                const center = donut.querySelector('.donut-chart__center');
                if (center) {
                    const maxIdx = expenseCategories.data.indexOf(Math.max(...expenseCategories.data));
                    const topLabel = expenseCategories.labels[maxIdx] || '';
                    const topPct = catTotal > 0 ? Math.round((expenseCategories.data[maxIdx] / catTotal) * 100) : 0;
                    const strong = center.querySelector('strong');
                    const span = center.querySelector('span');
                    if (strong) strong.textContent = topLabel || '';
                    if (span) span.textContent = `${topPct}%`;
                }
            }
        } catch (err) {
            console.warn('Failed to update category legend', err);
        }

        // --- Weekly Pulse (today + percent vs yesterday) ---
        try {
            const expenses = getExpenses() || [];
            const toKey = (d) => d.toISOString().split('T')[0];
            const today = new Date();
            const todayKey = toKey(today);
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayKey = toKey(yesterday);
            const sumByDate = (key) => expenses.filter(e => (e.date || '').startsWith(key)).reduce((s, x) => s + (Number(x.amount) || 0), 0);
            const todaySum = sumByDate(todayKey);
            const yesterdaySum = sumByDate(yesterdayKey);

            const pulseStrong = document.querySelectorAll('.pulse-stats strong');
            const pulseHelpers = document.querySelectorAll('.pulse-stats .helper-text');
            if (pulseStrong && pulseStrong.length > 0) {
                pulseStrong[0].textContent = formatCurrency(todaySum);
            }
            // percent change helper
            if (pulseHelpers && pulseHelpers.length > 0) {
                let text = '';
                if (yesterdaySum === 0) {
                    text = todaySum === 0 ? 'No change' : `↑ New today`;
                } else {
                    const diff = Math.round(((todaySum - yesterdaySum) / Math.max(1, yesterdaySum)) * 100);
                    text = `${diff > 0 ? '↑' : diff < 0 ? '↓' : 'Flat'} ${Math.abs(diff)}% vs yesterday`;
                }
                pulseHelpers[0].textContent = text;
            }

            // Safe-to-spend update (second strong in pulse-stats)
            const totalSpent = expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
            const user = getUser() || {};
            const budget = Number(user.budget) || 0;
            const remaining = Math.max(0, budget - totalSpent);
            if (pulseStrong && pulseStrong.length > 1) {
                pulseStrong[1].textContent = formatCurrency(remaining);
            }

            // Also update the highlight-card value (budget remaining)
            const budgetValueEl = document.querySelector('.highlight-card--accent .highlight-card__value');
            if (budgetValueEl) {
                budgetValueEl.textContent = `${formatCurrency(remaining)}`;
            }
            // Update the pulse SVG area & line based on last 9 days of spending
            try {
                const days = 9;
                const now = new Date();
                const daily = new Array(days).fill(0);
                expenses.forEach((e) => {
                    const d = new Date(e.date);
                    if (!isNaN(d)) {
                        const diff = Math.floor((now - d) / (24 * 60 * 60 * 1000));
                        if (diff >= 0 && diff < days) {
                            daily[days - 1 - diff] += Number(e.amount) || 0;
                        }
                    }
                });

                // Map daily values to SVG coordinates
                const maxVal = Math.max(...daily, 1);
                const width = 400;
                const height = 120; // max draw height
                const step = width / (days - 1);
                const points = daily.map((v, i) => {
                    const x = Math.round(i * step);
                    // invert so larger values go up (smaller y)
                    const y = Math.round(height - (v / maxVal) * (height - 20)) + 40; // shift to fit view
                    return { x, y };
                });

                const path = `M0,${points[0].y} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L400,160 L0,160 Z`;
                const poly = points.map(p => `${p.x},${p.y}`).join(' ');
                const pulseArea = document.querySelector('.pulse-area');
                const pulseLine = document.querySelector('.pulse-line');
                if (pulseArea) pulseArea.setAttribute('d', path);
                if (pulseLine) pulseLine.setAttribute('points', poly);
            } catch (err) {
                console.warn('Failed to update pulse SVG', err);
            }
        } catch (err) {
            console.warn('Failed to update weekly pulse or safe-to-spend', err);
        }

        // --- Upcoming reminders ---
        try {
            const reminders = [
                { date: 'Nov 26', title: 'Lab materials', amount: 350, note: 'Supplies' },
                { date: 'Nov 28', title: 'Library membership', amount: 150, note: 'Books' },
                { date: 'Nov 30', title: 'Gym renewal', amount: 220, note: 'Gym' },
                { date: 'Dec 01', title: 'Class trip deposit', amount: 600, note: 'Transport' },
            ];
            const expenses = getExpenses() || [];
            const timeline = document.querySelector('.timeline');
            if (timeline) {
                timeline.innerHTML = reminders.map((r) => {
                    // check if any expense mentions the reminder title
                    const matched = expenses.find(e => (e.description || e.notes || '').toLowerCase().includes(r.title.toLowerCase()));
                    const paidNote = matched ? `<p class="helper-text">Paid: ${formatCurrency(matched.amount)}</p>` : `<p class="helper-text">Expected ETB ${r.amount} · ${r.note}</p>`;
                    return `
                        <li>
                            <span>${r.date}</span>
                            <div>
                                <strong>${r.title}</strong>
                                ${paidNote}
                            </div>
                        </li>
                    `;
                }).join('');
            }
        } catch (err) {
            console.warn('Failed to update reminders', err);
        }

        // --- Smart suggestions (Cosmetics, Coffee, Gym) ---
        try {
            const expenses = getExpenses() || [];
            const now = new Date();
            const toKey = (d) => d.toISOString().split('T')[0];
            const withinDays = (d, days) => {
                const date = new Date(d);
                const diff = Math.floor((now - date) / (24 * 60 * 60 * 1000));
                return diff >= 0 && diff < days;
            };
            const sumForCategoryRange = (catKeyword, daysStart, daysEnd) => {
                // daysStart inclusive from now (0 means today), daysEnd exclusive
                return expenses.reduce((s, e) => {
                    try {
                        const ed = new Date(e.date);
                        const diffDays = Math.floor((now - ed) / (24 * 60 * 60 * 1000));
                        if (diffDays >= daysStart && diffDays < daysEnd) {
                            const desc = (e.category || e.notes || e.description || '').toLowerCase();
                            if (desc.includes(catKeyword.toLowerCase())) return s + (Number(e.amount) || 0);
                        }
                    } catch (e) {}
                    return s;
                }, 0);
            };

            const suggestionKeys = ['Cosmetics', 'Coffee', 'Gym'];
            const sparkCards = Array.from(document.querySelectorAll('.spark-grid .spark-card'));
            suggestionKeys.forEach((key, idx) => {
                const last7 = sumForCategoryRange(key, 0, 7);
                const prev7 = sumForCategoryRange(key, 7, 14);
                let display = 'Flat';
                if (prev7 === 0) {
                    if (last7 === 0) display = 'Flat';
                    else display = `↑ ${Math.round(100)}%`;
                } else {
                    const change = Math.round(((last7 - prev7) / Math.max(1, prev7)) * 100);
                    if (change > 0) display = `↑ ${Math.abs(change)}%`;
                    else if (change < 0) display = `↓ ${Math.abs(change)}%`;
                    else display = 'Flat';
                }
                if (sparkCards[idx]) {
                    const strong = sparkCards[idx].querySelector('strong');
                    if (strong) strong.textContent = display;
                }
            });
        } catch (err) {
            console.warn('Failed to update smart suggestions', err);
        }
    };

    // Wire updates to expense events
    window.addEventListener('expensesUpdated', () => {
        try {
            updateAllCharts();
        } catch (err) {
            console.warn('Failed to update charts on expensesUpdated', err);
        }
    });

    // Also update when the user profile changes in the same tab
    window.addEventListener('userUpdated', () => {
        try {
            updateAllCharts();
        } catch (err) {
            console.warn('Failed to update charts on userUpdated', err);
        }
    });

    // Also refresh when storage changes (other tabs)
    window.addEventListener('storage', (e) => {
        if (!e.key) return;
        if (e.key === (window?.App?.STORAGE_KEYS?.expenses || 'edufinance-expenses') || e.key === (window?.App?.STORAGE_KEYS?.user || 'edufinance-user')) {
            try {
                updateAllCharts();
            } catch (err) {
                console.warn('Failed to update charts on storage event', err);
            }
        }
    });

    // Initial compute to populate charts with stored data
    try {
        updateAllCharts();
    } catch (err) {
        console.warn('Failed initial chart update', err);
    }

    // Listen for theme changes
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Wait for theme to be toggled
            setTimeout(handleThemeChange, 100);
        });
    }

    // Initial theme check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
});
>>>>>>> eb4b0ab6b3af2982f8a1e8049d5578c2995278fe

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Sample data - replace with actual data from your backend
    const monthlyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        income: [8500, 8200, 8800, 9000, 9200, 9500, 9800, 10000, 10200, 10500, 10800, 11000],
        expenses: [7500, 7800, 8200, 8000, 8500, 8800, 9000, 9200, 8900, 9100, 9300, 9500]
    };

    const expenseCategories = {
        labels: ['Tuition', 'Food', 'Transport', 'Entertainment', 'Savings', 'Miscellaneous'],
        data: [45, 20, 15, 10, 25, 5],
        colors: ['#4285F4', '#FF6D00', '#9C27B0', '#00BFA5', '#FFD600', '#FF4081']
    };

    const savingsData = {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        amounts: [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500]
    };

    const budgetData = {
        spent: 28750,
        total: 36000,
        percentage: 80
    };

    const financialHealthScore = 75; // Out of 100

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
    if (incomeExpenseCtx) {
        new Chart(incomeExpenseCtx, {
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

    // 2. Expense Breakdown Donut Chart
    const expenseBreakdownCtx = document.getElementById('expenseBreakdownChart');
    if (expenseBreakdownCtx) {
        new Chart(expenseBreakdownCtx, {
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
    if (savingsGrowthCtx) {
        new Chart(savingsGrowthCtx, {
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
    if (budgetUtilizationCtx) {
        new Chart(budgetUtilizationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Spent', 'Remaining'],
                datasets: [{
                    data: [budgetData.spent, budgetData.total - budgetData.spent],
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

        // Add text in the center of the budget utilization chart
        const centerText = document.createElement('div');
        centerText.className = 'chart-center-text';
        centerText.innerHTML = `
            <div class="percentage">${budgetData.percentage}%</div>
            <div class="label">Utilized</div>
            <div class="amount">${formatCurrency(budgetData.spent)}</div>
        `;
        budgetUtilizationCtx.parentNode.appendChild(centerText);
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

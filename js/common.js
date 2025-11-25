(function (window) {
    const STORAGE_KEYS = {
        theme: "edufinance-theme",
        user: "edufinance-user",
        expenses: "edufinance-expenses",
        split: "edufinance-split-expenses",
        friends: "edufinance-friends",
        session: "edufinance-session",
        tips: "edufinance-tips",
    };

    const defaultUser = {
        name: "Student",
        email: "student@edufinance.com",
        budget: 5000,
        currency: "Birr",
        notifications: true,
        avatarBase64: null,
        theme: "light",
    };

    // Default expenses are generated relative to "today" so charts always have
    // visible structure in the current range for brand-new users.
    const today = new Date();
    const toDateKey = (offsetDays) => {
        const d = new Date(today.getTime() - offsetDays * 86400000);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const defaultExpenses = [
        { id: "1", date: toDateKey(1), category: "Food", amount: 120, notes: "Lunch at cafeteria" },
        { id: "2", date: toDateKey(2), category: "Transport", amount: 80, notes: "Bus fare" },
        { id: "3", date: toDateKey(3), category: "Books", amount: 450, notes: "Textbooks for semester" },
        { id: "4", date: toDateKey(4), category: "Entertainment", amount: 200, notes: "Movie with friends" },
        { id: "5", date: toDateKey(5), category: "Food", amount: 95, notes: "Groceries" },
    ];

    const defaultTips = [
        {
            id: "tip-track-daily",
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
            id: "tip-set-budget",
            icon: "🎯",
            title: "Set Budget Goals",
            preview: "Break down monthly goals into daily limits.",
            checklist: [
                "Calculate your monthly budget",
                "Divide into weekly targets",
                "Reserve money for fixed costs",
                "Keep an emergency buffer",
            ],
        },
        {
            id: "tip-meal-plan",
            icon: "🍽️",
            title: "Meal Planning Saves Money",
            preview: "Plan meals to curb impulse purchases.",
            checklist: [
                "Plan meals for the week",
                "Make a shopping list",
                "Cook in batches",
                "Pack lunch instead of buying",
            ],
        },
        {
            id: "tip-smart-books",
            icon: "📚",
            title: "Smart Book Buying",
            preview: "Use library resources and second-hand books.",
            checklist: [
                "Check library first",
                "Buy used when possible",
                "Share with classmates",
                "Sell books after use",
            ],
        },
        {
            id: "tip-transport",
            icon: "🚗",
            title: "Transportation Tips",
            preview: "Optimize commutes to save on transport costs.",
            checklist: [
                "Use monthly transport passes",
                "Carpool when possible",
                "Walk short distances",
                "Plan efficient routes",
            ],
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

    const removeState = (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove ${key}`, error);
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
        const formatted = amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        if (currency === "Birr" || currency === "ETB") {
            return `${formatted} Birr`;
        }

        const symbol = currency === "USD" ? "$" : currency;
        return `${symbol} ${formatted}`;
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

    const syncTheme = () => {
        const saved = localStorage.getItem(STORAGE_KEYS.theme);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const isDark = saved ? saved === "dark" : prefersDark;
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        const toggle = qs("#themeToggle");
        if (toggle) {
            toggle.textContent = isDark ? "☀️" : "🌙";
        }
    };

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute("data-theme");
        const isDark = current !== "dark";
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
        const toggle = qs("#themeToggle");
        if (toggle) {
            toggle.textContent = isDark ? "☀️" : "🌙";
        }
        // Dispatch event for charts to re-render
        window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: isDark ? "dark" : "light" } }));
    };

    const initTheme = () => {
        syncTheme();
        qs("#themeToggle")?.addEventListener("click", toggleTheme);
    };

    const getSession = () => loadState(STORAGE_KEYS.session, { isAuthenticated: false });

    const setSession = (session) => saveState(STORAGE_KEYS.session, session);

    const clearSession = () => removeState(STORAGE_KEYS.session);

    const isAuthenticated = () => Boolean(getSession()?.isAuthenticated);

    const requireAuth = () => {
        if (!isAuthenticated()) {
            window.location.href = "login.html";
            return false;
        }
        return true;
    };

    const initShellNavigation = () => {
        const navToggle = qs("[data-nav-toggle]");
        const navDrawer = qs("[data-nav-drawer]");
        if (!navDrawer) return;
        const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
        const closeNav = () => {
            navDrawer.removeAttribute("data-open");
            navToggle?.setAttribute("aria-expanded", "false");
            document.body.classList.remove("nav-open");
        };
        const openNav = () => {
            navDrawer.setAttribute("data-open", "true");
            navToggle?.setAttribute("aria-expanded", "true");
            document.body.classList.add("nav-open");
        };

        navToggle?.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            if (expanded) {
                closeNav();
            } else {
                openNav();
            }
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeNav();
            }
        });

        navLinks.forEach((link) => {
            link.addEventListener("click", () => closeNav());
        });

        const pageKey = document.body?.dataset?.page;
        if (pageKey) {
            navLinks.forEach((link) => {
                link.classList.toggle("is-active", link.dataset.navLink === pageKey);
            });
        }
    };

    const bindLogoutButton = () => {
        const logoutButton = qs("#logout");
        if (!logoutButton) return;
        logoutButton.addEventListener("click", () => {
            clearSession();
            showToast("Logged out");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 300);
        });
    };

    const initModal = (overlayId = "modalOverlay", closeId = "modalClose", cancelId = "modalCancel") => {
        const overlay = qs(`#${overlayId}`);
        const closeBtn = qs(`#${closeId}`);
        const cancelBtn = qs(`#${cancelId}`);
        
        const closeModal = () => {
            if (overlay) overlay.hidden = true;
        };
        
        closeBtn?.addEventListener("click", closeModal);
        cancelBtn?.addEventListener("click", closeModal);
        overlay?.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal();
        });
        
        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && overlay && !overlay.hidden) {
                closeModal();
            }
        });
        
        return { open: () => { if (overlay) overlay.hidden = false; }, close: closeModal };
    };

    const initPageShell = ({ auth = false } = {}) => {
        initTheme();
        initShellNavigation();
        bindLogoutButton();
        if (auth && !requireAuth()) {
            return false;
        }
        return true;
    };

    const initNavHighlights = ({
        linkSelector = ".nav-links a",
        mobileLinkSelector = ".mobile-menu a",
        sectionSelector = "main section[id]",
        activeClass = "is-active",
    } = {}) => {
        if (!window.IntersectionObserver) return () => {};
        const anchors = [
            ...new Set([
                ...Array.from(document.querySelectorAll(linkSelector) || []),
                ...Array.from(document.querySelectorAll(mobileLinkSelector) || []),
            ]),
        ].filter((anchor) => anchor.hash && document.getElementById(anchor.hash.slice(1)));
        const sections = Array.from(document.querySelectorAll(sectionSelector));
        if (!anchors.length || !sections.length) return () => {};

        const sectionToLinks = new Map();
        anchors.forEach((anchor) => {
            const id = anchor.hash.slice(1);
            const list = sectionToLinks.get(id) || [];
            list.push(anchor);
            sectionToLinks.set(id, list);
        });

        const setActive = (id) => {
            sectionToLinks.forEach((links, key) => {
                links.forEach((link) => {
                    link.classList.toggle(activeClass, key === id);
                });
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (!visible.length) return;
                setActive(visible[0].target.id);
            },
            { rootMargin: "-35% 0px -45% 0px", threshold: [0.2, 0.4, 0.6] }
        );

        sections.forEach((section) => observer.observe(section));

        anchors.forEach((anchor) => {
            anchor.addEventListener("click", () => setActive(anchor.hash.slice(1)));
        });

        const initialHash = window.location.hash.slice(1);
        if (initialHash && sectionToLinks.has(initialHash)) {
            setActive(initialHash);
        }

        return () => observer.disconnect();
    };

    const App = {
        STORAGE_KEYS,
        defaultUser,
        defaultExpenses,
        defaultTips,
        defaultSplitFriends,
        defaultSplitExpenses,
        qs,
        qsa,
        clone,
        loadState,
        saveState,
        removeState,
        showToast,
        formatCurrency,
        calculateStats,
        syncTheme,
        toggleTheme,
        initTheme,
        initNavHighlights,
        initShellNavigation,
        initPageShell,
        initModal,
        getSession,
        setSession,
        clearSession,
        isAuthenticated,
        requireAuth,
        bindLogoutButton,
    };

        const updatePieChart = (canvasId, data, options = {}) => {
            const canvas = qs(`#${canvasId}`);
            if (!canvas || typeof Chart === "undefined") return null;
            const ctx = canvas.getContext("2d");
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            const defaultColors = ["#27ae60", "#f39c12", "#3498db", "#9b59b6", "#e74c3c"];
            const colors = options.colors || defaultColors;
            const labels = data.map((item) => item.label || item.category);
            const values = data.map((item) => item.value || item.amount);
            if (window[`pieChart_${canvasId}`]) {
                window[`pieChart_${canvasId}`].destroy();
            }
            window[`pieChart_${canvasId}`] = new Chart(ctx, {
                type: "pie",
                data: {
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderColor: isDark ? "#34495e" : "#ffffff",
                        borderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: options.legendPosition || "bottom",
                            labels: { 
                                color: isDark ? "#bdc3c7" : "#7f8c8d",
                                padding: 12,
                            },
                        },
                    },
                },
            });
            return window[`pieChart_${canvasId}`];
        };

        App.updatePieChart = updatePieChart;

        window.App = App;
    })(window);

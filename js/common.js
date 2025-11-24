(function (window) {
    const STORAGE_KEYS = {
        theme: "edufinance-theme",
        user: "edufinance-user",
        expenses: "edufinance-expenses",
        split: "edufinance-split-expenses",
        friends: "edufinance-friends",
        session: "edufinance-session",
    };

    const defaultUser = {
        name: "Student",
        email: "student@edufinance.com",
        budget: 5000,
        currency: "Birr",
        notifications: true,
    };

    const defaultExpenses = [
        { id: "1", date: "2025-11-20", category: "Food", amount: 120, notes: "Lunch at cafeteria" },
        { id: "2", date: "2025-11-19", category: "Transport", amount: 80, notes: "Bus fare" },
        { id: "3", date: "2025-11-19", category: "Books", amount: 450, notes: "Textbooks for semester" },
        { id: "4", date: "2025-11-18", category: "Entertainment", amount: 200, notes: "Movie with friends" },
        { id: "5", date: "2025-11-17", category: "Food", amount: 95, notes: "Groceries" },
    ];

    const defaultTips = [
        {
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
        const prefix = currency === "USD" ? "$" : "Birr";
        return `${prefix} ${amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
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
        document.body.classList.toggle("theme-dark", isDark);
        document.body.classList.toggle("theme-light", !isDark);
        const toggle = qs("#themeToggle");
        if (toggle) {
            toggle.textContent = isDark ? "☀️" : "🌙";
        }
    };

    const toggleTheme = () => {
        const isDark = document.body.classList.toggle("theme-dark");
        document.body.classList.toggle("theme-light", !isDark);
        localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
        const toggle = qs("#themeToggle");
        if (toggle) {
            toggle.textContent = isDark ? "☀️" : "🌙";
        }
    };

    const initTheme = () => {
        syncTheme();
        qs("#themeToggle")?.addEventListener("click", toggleTheme);
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
    };

    window.App = App;
})(window);

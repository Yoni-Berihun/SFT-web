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
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-line-chart">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
            </svg>`,
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
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
            </svg>`,
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
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-utensils">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                <path d="M7 2v20"/>
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>`,
            title: "Meal Planning Saves Money",
            preview: "Plan meals to curb impulse purchases.",
            checklist: [
                "Plan meals for the week",
                "Make a shopping list",
                "Cook in batches",
                "Pack lunch instead of buying",
            ],
        }
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

    const updateThemeIcon = (isDark) => {
        const html = document.documentElement;
        const themeToggle = qs('#themeToggle');
        
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            
            // Toggle data-theme attribute for CSS custom properties
            if (isDark) {
                html.setAttribute('data-theme', 'dark');
                html.classList.add('dark');
            } else {
                html.setAttribute('data-theme', 'light');
                html.classList.remove('dark');
            }
        }
    };

    const syncTheme = () => {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        updateThemeIcon(theme === 'dark');
    };

    const toggleTheme = () => {
        console.log('Toggling theme...');
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        console.log(`Changing theme from ${currentTheme} to ${newTheme}`);
        
        // Apply new theme
        html.setAttribute('data-theme', newTheme);
        
        // Toggle dark class for Tailwind dark mode
        if (newTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        // Save preference
        localStorage.setItem(STORAGE_KEYS.theme, newTheme);
        console.log('Theme saved to localStorage');
        
        // Update icon and ARIA attributes
        updateThemeIcon(newTheme === 'dark');
        
        // Dispatch event for other scripts that might need to know about theme changes
        const event = new CustomEvent('themeChange', { detail: { theme: newTheme } });
        document.dispatchEvent(event);
        console.log('Dispatched themeChange event');
    };

    const initTheme = () => {
        console.log('Initializing theme...');
        // Set initial theme
        syncTheme();
        
        // Set up theme toggle button
        const themeToggle = qs('#themeToggle');
        console.log('Theme toggle button:', themeToggle);
        
        if (themeToggle) {
            console.log('Adding event listeners to theme toggle');
            themeToggle.addEventListener('click', (e) => {
                console.log('Theme toggle clicked');
                e.preventDefault();
                toggleTheme();
            });
            
            // Add keyboard support
            themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    console.log('Theme toggle activated via keyboard');
                    e.preventDefault();
                    toggleTheme();
                }
            });
        } else {
            console.warn('Theme toggle button not found!');
        }
        
        // Watch for system theme changes
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMediaQuery.addEventListener('change', (e) => {
            console.log('System color scheme changed:', e.matches ? 'dark' : 'light');
            if (!localStorage.getItem(STORAGE_KEYS.theme)) {
                syncTheme();
            }
        });
    };

    // ========== UPDATED AUTHENTICATION FUNCTIONS ==========
    
    // Get session with Firebase support
    const getSession = () => {
        const storedSession = loadState(STORAGE_KEYS.session, { isAuthenticated: false });
        
        // Check Firebase auth state if available
        if (window.Auth?.getCurrentUser) {
            const firebaseUser = Auth.getCurrentUser();
            if (firebaseUser && firebaseUser.uid) {
                return {
                    ...storedSession,
                    isAuthenticated: true,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    firebaseUser: true,
                    authenticatedAt: new Date().toISOString()
                };
            }
        }
        
        return storedSession;
    };

    // Set session (supports Firebase user data)
    const setSession = (session) => {
        // If we have Firebase user, include that data
        if (window.Auth?.getCurrentUser) {
            const firebaseUser = Auth.getCurrentUser();
            if (firebaseUser) {
                session.uid = firebaseUser.uid;
                session.email = firebaseUser.email;
                session.firebaseUser = true;
            }
        }
        saveState(STORAGE_KEYS.session, session);
    };

    const clearSession = () => removeState(STORAGE_KEYS.session);

    // Check authentication with Firebase support
    const isAuthenticated = () => {
        // First check Firebase - this is the source of truth
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const firebaseUser = window.firebaseAuth.currentUser;
            if (firebaseUser && firebaseUser.uid && firebaseUser.email) {
                return true;
            }
        }
        
        // Also check via Auth module
        if (window.Auth?.getCurrentUser) {
            const firebaseUser = Auth.getCurrentUser();
            if (firebaseUser && firebaseUser.uid && firebaseUser.email) {
                return true;
            }
        }
        
        // Don't rely on localStorage alone - it can be stale
        // Only use it if Firebase is not available
        if (!window.firebaseAuth && !window.Auth) {
            const session = getSession();
            return Boolean(session?.isAuthenticated);
        }
        
        return false;
    };

    // Require authentication with Firebase support (async version)
    const requireAuth = () => {
        // Don't redirect if we're on login or signup pages
        const currentPath = window.location.pathname;
        if (currentPath.includes('login.html') || 
            currentPath.includes('signup.html') ||
            window.__onAuthPage) {
            return true; // Return true to allow page to load
        }
        
        // Use a flag to prevent multiple redirect attempts
        if (window.__authCheckInProgress) {
            return true; // Already checking, wait
        }
        window.__authCheckInProgress = true;
        
        // First, check if Firebase has a current user immediately
        // This handles the case where auth state is already restored
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const user = window.firebaseAuth.currentUser;
            if (user && user.uid && user.email) {
                // User is authenticated, allow access
                window.__authCheckInProgress = false;
                console.log('✅ User authenticated (currentUser check)');
                return true;
            }
        }
        
        // Check localStorage session as quick fallback
        const session = getSession();
        if (session?.isAuthenticated && session?.uid) {
            // Has session, allow access while Firebase initializes
            window.__authCheckInProgress = false;
            console.log('⚠️ Using localStorage session, allowing access');
            return true;
        }
        
        // Check Firebase auth state properly using onAuthStateChanged
        // This handles the case where Firebase is still restoring auth state
        if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChanged === 'function') {
            // Use Firebase's auth state observer
            let authChecked = false;
            let redirectTimeout = null;
            
            const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
                if (authChecked) return; // Only check once
                
                if (user && user.uid && user.email) {
                    // User is authenticated
                    authChecked = true;
                    window.__authCheckInProgress = false;
                    console.log('✅ User authenticated (onAuthStateChanged)');
                    if (redirectTimeout) clearTimeout(redirectTimeout);
                    // Don't unsubscribe - keep listener active for auth state changes
                    return; // Stay on page
                } else {
                    // User is not authenticated - only redirect if we haven't checked yet
                    if (!authChecked) {
                        authChecked = true;
                        window.__authCheckInProgress = false;
                        unsubscribe(); // Clean up listener
                        console.log('❌ User not authenticated, redirecting to login');
                        
                        // Small delay to prevent redirect loops
                        redirectTimeout = setTimeout(() => {
                            if (!window.__onAuthPage && !currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                                // Double-check before redirecting
                                if (!window.firebaseAuth?.currentUser && !getSession()?.isAuthenticated) {
                                    window.location.href = "login.html";
                                }
                            }
                        }, 500);
                    }
                }
            });
            
            // Set a timeout to prevent infinite waiting
            // Give Firebase up to 3 seconds to restore auth state
            setTimeout(() => {
                if (!authChecked) {
                    authChecked = true;
                    window.__authCheckInProgress = false;
                    
                    // Final check before redirecting
                    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                        const user = window.firebaseAuth.currentUser;
                        if (user && user.uid && user.email) {
                            console.log('✅ User authenticated (timeout check)');
                            unsubscribe();
                            return; // User is authenticated
                        }
                    }
                    
                    // Check localStorage one more time
                    const finalSession = getSession();
                    if (finalSession?.isAuthenticated && finalSession?.uid) {
                        console.log('⚠️ Using localStorage session as final fallback');
                        unsubscribe();
                        return; // Has session, allow access
                    }
                    
                    // No auth found anywhere, redirect to login
                    unsubscribe();
                    if (!window.__onAuthPage && !currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                        console.log('❌ No authentication found, redirecting to login');
                        setTimeout(() => {
                            if (!window.firebaseAuth?.currentUser && !getSession()?.isAuthenticated) {
                                window.location.href = "login.html";
                            }
                        }, 500);
                    }
                }
            }, 3000);
            
            return true; // Return true to allow page to load while checking
        }
        
        // If no Firebase and no session, redirect to login
        window.__authCheckInProgress = false;
        if (!isAuthenticated() && !window.__onAuthPage) {
            if (!currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                setTimeout(() => {
                    if (!window.firebaseAuth?.currentUser && !getSession()?.isAuthenticated) {
                        window.location.href = "login.html";
                    }
                }, 500);
            }
            return false;
        }
        return true;
    };

    // Get current user ID (Firebase priority)
    const getCurrentUserId = () => {
        // Try Firebase first
        if (window.Auth?.getCurrentUser) {
            const firebaseUser = Auth.getCurrentUser();
            if (firebaseUser?.uid) {
                return firebaseUser.uid;
            }
        }
        
        // Fallback to localStorage
        const session = getSession();
        return session?.uid || 'local-user';
    };

    // ========== END UPDATED AUTH FUNCTIONS ==========

    // Smooth scrolling to anchor links
    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#' || targetId === '#!') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    
                    // Close mobile menu if open
                    const nav = document.querySelector('.primary-nav');
                    if (nav && nav.classList.contains('is-active')) {
                        document.querySelector('.nav-toggle').click();
                    }
                    
                    // Scroll to the target element
                    const headerOffset = 80; // Adjust this value based on your header height
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without adding to history
                    if (history.pushState) {
                        history.pushState(null, null, targetId);
                    } else {
                        location.hash = targetId;
                    }
                }
            });
        });
    }

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

    // Updated logout to work with Firebase
    const bindLogoutButton = () => {
        const logoutButton = qs("#logout");
        if (!logoutButton) return;
        
        logoutButton.addEventListener("click", async () => {
            // Sign out from Firebase if available
            if (window.Auth?.signOut) {
                try {
                    await Auth.signOut();
                } catch (error) {
                    console.warn("Firebase sign out error:", error);
                }
            }
            
            // Clear localStorage session
            clearSession();
            
            // Show notification
            showToast("Logged out successfully");
            
            // Redirect to login page
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
        initSmoothScrolling();
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

    // Expose theme functions globally
    window.toggleTheme = toggleTheme;
    window.updateThemeIcon = updateThemeIcon;
    window.syncTheme = syncTheme;

    const App = {
        STORAGE_KEYS,
        defaultUser,
        defaultExpenses,
        toggleTheme,
        updateThemeIcon,
        syncTheme,
        defaultTips,
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
        initSmoothScrolling,
        getSession,
        setSession,
        clearSession,
        isAuthenticated,
        requireAuth,
        bindLogoutButton,
        getCurrentUserId
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

    // Initialize theme when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize theme
        initTheme();
        
        // Add direct click handler to the theme toggle button
        const themeToggle = document.querySelector('#themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }
    });
    
    console.log('✅ App module loaded with Firebase support');
})(window);
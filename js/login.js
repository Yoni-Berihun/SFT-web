// Updated login.js with Firebase
document.addEventListener("DOMContentLoaded", () => {
    // Prevent redirects when navigating between auth pages
    window.__onAuthPage = true;
    
    // Initialize page shell
    if (window.App && window.App.initPageShell) {
        App.initPageShell();
    }

    // Get form elements with null checks
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberInput = document.getElementById("rememberMe");
    const form = document.getElementById("loginForm");
    const message = document.getElementById("loginMessage");

    // Ensure all required elements exist
    if (!emailInput || !passwordInput || !form) {
        console.error("Login form elements not found!");
        if (message) {
            message.textContent = "Form initialization error. Please refresh the page.";
            message.classList.add("show");
        }
        return;
    }

    // Ensure form inputs are always enabled
    emailInput.disabled = false;
    passwordInput.disabled = false;
    if (rememberInput) rememberInput.disabled = false;

    // Simple check: Only redirect if user is already authenticated
    // This runs once after a delay to allow Firebase to initialize
    let authCheckDone = false;
    let isNavigatingAway = false;
    let redirectTimeout = null;
    
    // Prevent redirects when user is navigating away
    window.addEventListener('beforeunload', () => {
        isNavigatingAway = true;
        if (redirectTimeout) {
            clearTimeout(redirectTimeout);
            redirectTimeout = null;
        }
    });
    
    // Also prevent redirects when clicking links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && (link.href.includes('signup.html') || link.href.includes('login.html'))) {
            isNavigatingAway = true;
            if (redirectTimeout) {
                clearTimeout(redirectTimeout);
                redirectTimeout = null;
            }
        }
    }, true);
    
    const checkAuthStatus = () => {
        if (authCheckDone || isNavigatingAway) return;
        authCheckDone = true;
        
        // Wait a bit for Firebase to initialize, then check once
        redirectTimeout = setTimeout(() => {
            // Don't redirect if user is navigating away or already left
            if (isNavigatingAway || !document.hasFocus()) {
                redirectTimeout = null;
                return;
            }
            
            // Only check if there's a real Firebase authenticated user
            if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                const user = window.firebaseAuth.currentUser;
                if (user && user.uid && user.email) {
                    // User is authenticated, redirect to dashboard
                    isNavigatingAway = true; // Prevent any other redirects
                    window.location.href = "dashboard.html";
                }
            }
            redirectTimeout = null;
        }, 2000); // Increased delay to ensure everything is loaded
    };
    
    // Run check after page loads
    checkAuthStatus();

    // Load remembered email
    if (window.App && window.App.getSession) {
        const session = App.getSession();
        if (session?.remember && session.email && emailInput) {
            emailInput.value = session.email;
            if (rememberInput) rememberInput.checked = true;
        }
    }

    const showMessage = (text, type = "error") => {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("success", type === "success");
        message.classList.add("show");
        setTimeout(() => message.classList.remove("show"), 2800);
    };

    // Prevent duplicate event listeners
    let isSubmitting = false;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Prevent double submission
        if (isSubmitting) {
            console.log("Form submission already in progress");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage("Enter both email and password to continue.");
            return;
        }

        if (!email.toLowerCase().endsWith("@gmail.com")) {
            showMessage("Incorrect email");
            return;
        }

        // Ensure inputs are enabled
        emailInput.disabled = false;
        passwordInput.disabled = false;

        isSubmitting = true;
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Signing in...";
        }

        try {
            // Wait for Auth to be available
            if (!window.Auth) {
                throw new Error("Authentication service not available. Please refresh the page.");
            }

            // Try Firebase authentication
            const result = await Auth.signIn(email, password);
            
            if (result.success) {
                // Save session with Firebase user
                const sessionPayload = {
                    isAuthenticated: true,
                    email: result.user.email,
                    uid: result.user.uid,
                    remember: rememberInput ? rememberInput.checked : false,
                    authenticatedAt: new Date().toISOString(),
                };

                if (window.App && window.App.setSession) {
                    App.setSession(sessionPayload);
                }
                
                // Save user data locally as fallback
                if (window.App && window.App.saveState) {
                    const userData = {
                        ...(App.defaultUser || {}),
                        email: result.user.email,
                        name: result.user.email.split("@")[0] || "Student",
                    };
                    
                    App.saveState(App.STORAGE_KEYS.user, userData);
                }
                
                // Ensure Firebase auth state is persisted
                // Firebase automatically persists auth state, but we'll wait a moment
                // to ensure it's saved before redirecting
                showMessage("Success! Redirecting to dashboard…", "success");

                // Wait a bit longer to ensure Firebase auth state is persisted
                setTimeout(() => {
                    // Double-check that user is still authenticated
                    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                        window.location.href = "dashboard.html";
                    } else {
                        // If auth state lost, try to restore from session
                        const session = App.getSession();
                        if (session?.isAuthenticated) {
                            window.location.href = "dashboard.html";
                        } else {
                            showMessage("Authentication error. Please try again.");
                            isSubmitting = false;
                            if (submitButton) {
                                submitButton.disabled = false;
                                submitButton.textContent = "Sign in";
                            }
                        }
                    }
                }, 800);
            } else {
                // Firebase authentication failed
                let errorMessage = result.error || "Login failed. Please check your credentials.";
                showMessage(errorMessage);
                
                // Re-enable form
                isSubmitting = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Sign in";
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            showMessage(error.message || "An unexpected error occurred. Please try again.");
            
            // Re-enable form
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Sign in";
            }
        }
    });
});
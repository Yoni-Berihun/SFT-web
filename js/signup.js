// js/signup.js
document.addEventListener("DOMContentLoaded", () => {
    // Prevent redirects when navigating between auth pages
    window.__onAuthPage = true;
    
    // Initialize page shell (theme, navigation)
    if (window.App && window.App.initPageShell) {
        window.App.initPageShell();
    }

    // Get form elements with null checks
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const budgetInput = document.getElementById("monthlyBudget");
    const currencySelect = document.getElementById("currency");
    const form = document.getElementById("signupForm");
    const message = document.getElementById("signupMessage");

    // Ensure all required elements exist
    if (!firstNameInput || !emailInput || !passwordInput || !confirmPasswordInput || !budgetInput || !form) {
        console.error("Signup form elements not found!");
        if (message) {
            message.textContent = "Form initialization error. Please refresh the page.";
            message.classList.add("show");
        }
        return;
    }

    // Ensure all inputs are enabled
    firstNameInput.disabled = false;
    if (lastNameInput) lastNameInput.disabled = false;
    emailInput.disabled = false;
    passwordInput.disabled = false;
    confirmPasswordInput.disabled = false;
    budgetInput.disabled = false;
    if (currencySelect) currencySelect.disabled = false;

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

    // Show message function
    const showMessage = (text, type = "error") => {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("success", type === "success");
        message.classList.add("show");
        setTimeout(() => message.classList.remove("show"), 4000);
    };

    // Validate password
    const validatePassword = (password) => {
        if (password.length < 6) {
            return "Password must be at least 6 characters long";
        }
        return null;
    };

    // Validate form
    const validateForm = () => {
        const firstName = firstNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const budget = parseFloat(budgetInput.value);
        
        // Check required fields
        if (!firstName) {
            showMessage("First name is required");
            firstNameInput.focus();
            return false;
        }
        
        if (!email) {
            showMessage("Email address is required");
            emailInput.focus();
            return false;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage("Please enter a valid email address");
            emailInput.focus();
            return false;
        }
        
        // Password validation
        const passwordError = validatePassword(password);
        if (passwordError) {
            showMessage(passwordError);
            passwordInput.focus();
            return false;
        }
        
        // Check password confirmation
        if (password !== confirmPassword) {
            showMessage("Passwords do not match");
            confirmPasswordInput.focus();
            return false;
        }
        
        // Check budget
        if (isNaN(budget) || budget < 0) {
            showMessage("Please enter a valid budget amount");
            budgetInput.focus();
            return false;
        }
        
        return true;
    };

    // Prevent duplicate event listeners
    let isSubmitting = false;

    // Form submission handler
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Prevent double submission
        if (isSubmitting) {
            console.log("Form submission already in progress");
            return;
        }

        if (!validateForm()) {
            return;
        }

        // Get form values
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput ? lastNameInput.value.trim() : "";
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const budget = parseFloat(budgetInput.value);
        const currency = currencySelect ? currencySelect.value : "Birr";

        // Ensure inputs are enabled
        firstNameInput.disabled = false;
        if (lastNameInput) lastNameInput.disabled = false;
        emailInput.disabled = false;
        passwordInput.disabled = false;
        confirmPasswordInput.disabled = false;
        budgetInput.disabled = false;

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : "Create Account";
        
        if (submitButton) {
            submitButton.textContent = "Creating account...";
            submitButton.disabled = true;
        }

        isSubmitting = true;

        try {
            // Prepare user data
            const userData = {
                name: lastName ? `${firstName} ${lastName}` : firstName,
                budget: budget,
                currency: currency,
                notifications: true,
                avatarBase64: null,
                theme: document.documentElement.getAttribute("data-theme") || "light"
            };

            // Create account with Firebase
            if (!window.Auth) {
                throw new Error("Authentication service not available. Please refresh the page.");
            }

            const result = await Auth.signUp(email, password, userData);
            
            if (result.success) {
                // Success! Account created
                const successText = "Account created successfully. Login and start using the website.";
                showMessage(successText, "success");
                
                // Save session
                const sessionPayload = {
                    isAuthenticated: true,
                    email: email,
                    uid: result.user.uid,
                    authenticatedAt: new Date().toISOString(),
                };
                
                if (window.App && window.App.setSession) {
                    window.App.setSession(sessionPayload);
                }
                
                // Save user data locally as fallback
                if (window.App && window.App.saveState) {
                    const localUserData = {
                        ...(window.App.defaultUser || {}),
                        ...userData,
                        email: email
                    };
                    window.App.saveState(window.App.STORAGE_KEYS?.user || "edufinance-user", localUserData);
                }
                
                // Show toast notification
                if (window.App && window.App.showToast) {
                    window.App.showToast("Welcome to EduFinance!");
                }
                
                if (submitButton) {
                    submitButton.textContent = successText;
                }
                
                // Ensure Firebase auth state is persisted before redirecting
                // Wait a bit longer to ensure Firebase has saved the auth state
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
                            showMessage("Authentication error. Please try logging in.");
                            isSubmitting = false;
                            if (submitButton) {
                                submitButton.textContent = originalText;
                                submitButton.disabled = false;
                            }
                        }
                    }
                }, 1500);
                
            } else {
                // Show error from Firebase
                showMessage(result.error || "Registration failed. Please try again.");
                isSubmitting = false;
                if (submitButton) {
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }
            
        } catch (error) {
            console.error("Signup error:", error);
            showMessage(error.message || "An unexpected error occurred. Please try again.");
            isSubmitting = false;
            if (submitButton) {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        }
    });

    // Real-time password validation
    let passwordTimeout;
    passwordInput?.addEventListener("input", () => {
        clearTimeout(passwordTimeout);
        passwordTimeout = setTimeout(() => {
            const password = passwordInput.value;
            if (password.length > 0 && password.length < 6) {
                showMessage("Password must be at least 6 characters", "error");
            } else if (message.classList.contains("show") && message.textContent.includes("Password must be at least")) {
                message.classList.remove("show");
            }
        }, 500);
    });

    // Confirm password validation
    confirmPasswordInput?.addEventListener("input", () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length > 0 && password !== confirmPassword) {
            showMessage("Passwords do not match", "error");
        } else if (message.classList.contains("show") && message.textContent.includes("Passwords do not match")) {
            message.classList.remove("show");
        }
    });

});
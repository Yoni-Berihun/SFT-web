// js/signup.js
document.addEventListener("DOMContentLoaded", () => {
    // Initialize page shell (theme, navigation)
    if (window.App && window.App.initPageShell) {
        window.App.initPageShell();
    }

    // Get form elements
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const budgetInput = document.getElementById("monthlyBudget");
    const currencySelect = document.getElementById("currency");
    const termsCheckbox = document.getElementById("acceptTerms");
    const form = document.getElementById("signupForm");
    const message = document.getElementById("signupMessage");

    // Check if user is already logged in
    if (window.Auth) {
        Auth.onAuthStateChanged((user) => {
            if (user && !user.isLocal) {
                window.location.href = "dashboard.html";
            }
        });
    }

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
        
        // Check terms
        if (!termsCheckbox.checked) {
            showMessage("You must accept the terms and conditions");
            return false;
        }
        
        return true;
    };

    // Form submission handler
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Get form values
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const budget = parseFloat(budgetInput.value);
        const currency = currencySelect.value;

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = "Creating account...";
        submitButton.disabled = true;

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
                throw new Error("Authentication service not available");
            }

            const result = await Auth.signUp(email, password, userData);
            
            if (result.success) {
                // Success! Account created
                showMessage("Account created successfully! Redirecting to dashboard...", "success");
                
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
                
                // Redirect to dashboard after delay
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1500);
                
            } else {
                // Show error from Firebase
                showMessage(result.error || "Registration failed. Please try again.");
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
            
        } catch (error) {
            console.error("Signup error:", error);
            showMessage("An unexpected error occurred. Please try again.");
            submitButton.textContent = originalText;
            submitButton.disabled = false;
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

    // Currency change handler
    currencySelect?.addEventListener("change", () => {
        const currency = currencySelect.value;
        
        // Update placeholder based on currency
        if (currency === "USD") {
            budgetInput.placeholder = "e.g., 1000";
        } else if (currency === "Birr") {
            budgetInput.placeholder = "e.g., 5000";
        } else if (currency === "EUR") {
            budgetInput.placeholder = "e.g., 800";
        } else if (currency === "GBP") {
            budgetInput.placeholder = "e.g., 700";
        }
    });

    // Set initial placeholder
    if (currencySelect) {
        currencySelect.dispatchEvent(new Event("change"));
    }
});
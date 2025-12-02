// Updated login.js with Firebase
document.addEventListener("DOMContentLoaded", () => {
    App.initPageShell();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberInput = document.getElementById("rememberMe");
    const form = document.getElementById("loginForm");
    const message = document.getElementById("loginMessage");

    // Check if already logged in
    Auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = "dashboard.html";
        }
    });

    // Load remembered email
    const session = App.getSession();
    if (session?.remember && session.email) {
        emailInput.value = session.email;
        rememberInput.checked = true;
    }

    const showMessage = (text, type = "error") => {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("success", type === "success");
        message.classList.add("show");
        setTimeout(() => message.classList.remove("show"), 2800);
    };

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage("Enter both email and password to continue.");
            return;
        }

        // Try Firebase authentication
        const result = await Auth.signIn(email, password);
        
        if (result.success) {
            // Save session with Firebase user
            const sessionPayload = {
                isAuthenticated: true,
                email: result.user.email,
                uid: result.user.uid,
                remember: rememberInput.checked,
                authenticatedAt: new Date().toISOString(),
            };

            App.setSession(sessionPayload);
            
            // Save user data locally as fallback
            const userData = {
                ...App.defaultUser,
                email: result.user.email,
                name: result.user.email.split("@")[0] || "Student",
            };
            
            App.saveState(App.STORAGE_KEYS.user, userData);
            
            showMessage("Success! Redirecting to dashboard…", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 600);
        } else {
            // Firebase authentication failed
            let errorMessage = "Login failed. Please check your credentials.";
            
            // User-friendly error messages
            switch(result.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Invalid email or password.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many failed attempts. Try again later.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Check your connection.";
                    break;
            }
            
            showMessage(errorMessage);
        }
    });
});
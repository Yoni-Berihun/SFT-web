document.addEventListener("DOMContentLoaded", () => {
    App.initTheme();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberInput = document.getElementById("rememberMe");
    const form = document.getElementById("loginForm");
    const message = document.getElementById("loginMessage");

    const session = App.loadState(App.STORAGE_KEYS.session, { isAuthenticated: false, remember: false, email: "" });

    if (session?.isAuthenticated) {
        window.location.href = "dashboard.html";
        return;
    }

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

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage("Enter both email and password to continue.");
            return;
        }

        const user = {
            ...App.defaultUser,
            ...App.loadState(App.STORAGE_KEYS.user, App.defaultUser),
            email,
            name: email.split("@")[0] || "Student",
        };

        const sessionPayload = {
            isAuthenticated: true,
            email,
            remember: rememberInput.checked,
            authenticatedAt: new Date().toISOString(),
        };

        App.saveState(App.STORAGE_KEYS.user, user);
        App.saveState(App.STORAGE_KEYS.session, sessionPayload);
        showMessage("Success! Redirecting to dashboard…", "success");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 600);
    });
});

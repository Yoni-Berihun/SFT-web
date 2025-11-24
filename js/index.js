document.addEventListener("DOMContentLoaded", () => {
    App.initTheme();

    const mobileToggle = document.getElementById("mobileToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    mobileToggle?.addEventListener("click", () => {
        const expanded = mobileToggle.getAttribute("aria-expanded") === "true";
        mobileToggle.setAttribute("aria-expanded", (!expanded).toString());
        mobileMenu?.toggleAttribute("hidden");
    });

    document.querySelectorAll('a[href^="#"]')?.forEach((link) => {
        link.addEventListener("click", () => {
            if (!mobileMenu) return;
            mobileMenu.setAttribute("hidden", "");
            mobileToggle?.setAttribute("aria-expanded", "false");
        });
    });
});

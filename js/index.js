document.addEventListener("DOMContentLoaded", () => {
    const navDrawer = document.querySelector("[data-nav-drawer]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));

    const closeNav = () => {
        if (!navDrawer || !navToggle) return;
        navDrawer.removeAttribute("data-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
    };

    const openNav = () => {
        if (!navDrawer || !navToggle) return;
        navDrawer.setAttribute("data-open", "true");
        navToggle.setAttribute("aria-expanded", "true");
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
        link.addEventListener("click", () => {
            closeNav();
        });
    });

    const determineActive = () => {
        const { pathname, hash } = window.location;
        if (hash === "#features") return "features";
        if (pathname.endsWith("about.html")) return "about";
        if (pathname.endsWith("login.html")) return "login";
        return "home";
    };

    const setActiveNav = () => {
        const activeKey = determineActive();
        navLinks.forEach((link) => {
            const matches = link.dataset.navLink === activeKey;
            link.classList.toggle("is-active", matches);
        });
    };

    setActiveNav();

    window.addEventListener("hashchange", setActiveNav);
});


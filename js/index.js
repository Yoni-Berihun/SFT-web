document.addEventListener("DOMContentLoaded", () => {
    // Initialize theme and navigation
    if (window.App && window.App.initPageShell) {
        window.App.initPageShell();
    }

    // Get all necessary elements
    const navDrawer = document.querySelector("[data-nav-drawer]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
    const aboutOverlay = document.getElementById('about-overlay');
    const aboutTrigger = document.getElementById('about-trigger');
    const closeAbout = document.getElementById('close-about');

    // Navigation toggle functionality
    const toggleNav = (show) => {
        if (!navDrawer || !navToggle) return;
        
        if (show) {
            navDrawer.setAttribute("data-open", "true");
            navToggle.setAttribute("aria-expanded", "true");
            document.body.classList.add("nav-open");
        } else {
            navDrawer.removeAttribute("data-open");
            navToggle.setAttribute("aria-expanded", "false");
            document.body.classList.remove("nav-open");
        }
    };

    // About overlay functionality
    const toggleAboutOverlay = (show) => {
        if (!aboutOverlay) return;
        
        if (show) {
            aboutOverlay.hidden = false;
            // Trigger reflow
            void aboutOverlay.offsetWidth;
            aboutOverlay.setAttribute('data-visible', 'true');
            document.body.style.overflow = 'hidden';
        } else {
            aboutOverlay.setAttribute('data-visible', 'false');
            aboutOverlay.addEventListener('transitionend', function handler() {
                if (aboutOverlay.getAttribute('data-visible') === 'false') {
                    aboutOverlay.hidden = true;
                    aboutOverlay.removeEventListener('transitionend', handler);
                }
            }, { once: true });
            document.body.style.overflow = '';
        }
    };

    // Handle all anchor link clicks for smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        const targetId = anchor.getAttribute('href');
        
        // Skip if it's the about trigger or empty hash
        if (anchor === aboutTrigger || targetId === '#') return;
        
        anchor.addEventListener('click', function(e) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                toggleNav(false); // Close mobile nav if open
                
                // Calculate offset for fixed header (adjust as needed)
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                // Smooth scroll to the target
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL without triggering scroll
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    location.hash = targetId;
                }
            }
        });
    });

    // Navigation toggle button
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            toggleNav(!isExpanded);
        });
    }

    // Close navigation when clicking a nav link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link !== aboutTrigger) { // Don't close for about trigger
                toggleNav(false);
            }
        });
    });

    // Close navigation when clicking outside
    document.addEventListener('click', (e) => {
        if (navDrawer?.hasAttribute('data-open') && 
            !e.target.closest('.primary-nav') && 
            e.target !== navToggle) {
            toggleNav(false);
        }
    });

    // About trigger click handler
    if (aboutTrigger) {
        aboutTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            toggleNav(false); // Close mobile nav if open
            toggleAboutOverlay(true);
        });
    }

    // Close about overlay handlers
    if (closeAbout) {
        closeAbout.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAboutOverlay(false);
        });
    }

    // Close about overlay when clicking outside
    if (aboutOverlay) {
        aboutOverlay.addEventListener('click', (e) => {
            if (e.target === aboutOverlay) {
                toggleAboutOverlay(false);
            }
        });
    }

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (navDrawer?.hasAttribute('data-open')) {
                toggleNav(false);
            }
            if (aboutOverlay?.getAttribute('data-visible') === 'true') {
                toggleAboutOverlay(false);
            }
        }
    });

    // Handle initial hash on page load
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }

    // Set active navigation based on scroll position or hash
    const setActiveNav = () => {
        const { hash } = window.location;
        let activeKey = 'home';
        
        if (hash === '#features') activeKey = 'features';
        else if (hash === '#abouts') activeKey = 'abouts';
        else if (hash === '#home' || hash === '') activeKey = 'home';
        
        navLinks.forEach((link) => {
            const matches = link.dataset.navLink === activeKey;
            link.classList.toggle('is-active', matches);
        });
    };
    
    // Update active nav on scroll
    const updateActiveNavOnScroll = () => {
        const sections = ['home', 'features', 'abouts'];
        const scrollPosition = window.pageYOffset + 100; // Offset for header
        
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i]);
            if (section && section.offsetTop <= scrollPosition) {
                const activeKey = sections[i];
                navLinks.forEach((link) => {
                    link.classList.toggle('is-active', link.dataset.navLink === activeKey);
                });
                break;
            }
        }
    };
    
    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(updateActiveNavOnScroll, 100);
    });

    // Initialize active navigation and update on hash change
    setActiveNav();
    window.addEventListener('hashchange', setActiveNav);

    // Handle learn more button if it exists
    const learnMoreBtn = document.querySelector('[data-learn-more]');
    const learnPanels = document.querySelectorAll('[data-learn-panel]');

    if (learnMoreBtn && learnPanels.length) {
        learnMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const willShow = Array.from(learnPanels).some(panel => panel.hidden);
            
            learnPanels.forEach(panel => {
                panel.hidden = !willShow;
            });
            
            // Update button text
            learnMoreBtn.textContent = willShow ? 'Show Less' : 'Learn More';
            learnMoreBtn.setAttribute("aria-expanded", willShow ? "true" : "false");

            if (willShow) {
                document.getElementById("features")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        });
    }
});

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
    const featuresSection = document.getElementById('features');
    const featureCards = document.querySelectorAll('.feature-card');
    const themeToggle = document.querySelector('[data-theme-toggle]');
    
    // Initialize AOS (Animate on Scroll) if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100
        });
    }
    
    // Add hover effect to feature cards
    featureCards.forEach(card => {
        // Add hover class on hover
        card.addEventListener('mouseenter', () => {
            card.classList.add('is-hovered');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('is-hovered');
        });
        
        // Add click effect
        card.addEventListener('click', (e) => {
            // Only trigger if not clicking on a link inside the card
            if (e.target.tagName !== 'A' && !e.target.closest('a')) {
                card.classList.add('is-clicked');
                setTimeout(() => {
                    card.classList.remove('is-clicked');
                }, 300);
            }
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                toggleNav(false);
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
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
    
    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
            
            // Update icon
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            }
        });
    }

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

    // Smooth scroll to element
    const smoothScrollTo = (targetId) => {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        // Close mobile nav if open
        toggleNav(false);

        // Update active nav link
        updateActiveNav(targetId);

        // Smooth scroll to target
        window.scrollTo({
            top: targetElement.offsetTop - 80, // Adjust for fixed header
            behavior: 'smooth'
        });

        // Update URL
        if (history.pushState) {
            history.pushState(null, null, targetId);
        } else {
            location.hash = targetId;
        }
    };

    // Update active navigation link
    const updateActiveNav = (targetId) => {
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === targetId) {
                link.classList.add('is-active');
            } else if (linkHref !== '#') { // Don't remove active from about button
                link.classList.remove('is-active');
            }
        });
    };

    // Handle scroll to update active nav
    const handleScroll = () => {
        const scrollPosition = window.scrollY + 100; // Add offset for fixed header
        
        // Check if features section is in view
        if (featuresSection) {
            const featuresTop = featuresSection.offsetTop;
            const featuresHeight = featuresSection.offsetHeight;
            
            if (scrollPosition >= featuresTop && 
                scrollPosition < featuresTop + featuresHeight) {
                updateActiveNav('#features');
            } else if (scrollPosition < 100) {
                // If at top of page, clear active states
                navLinks.forEach(link => link.classList.remove('is-active'));
            }
        }
    };

    // Navigation toggle button
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            toggleNav(!isExpanded);
        });
    }

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

    // Initialize scroll handler
    window.addEventListener('scroll', handleScroll);
    
    // Check initial hash
    if (window.location.hash) {
        smoothScrollTo(window.location.hash);
    }
});

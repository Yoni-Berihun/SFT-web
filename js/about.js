// Initialize animations and interactions when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize page shell and modal
    App.initPageShell();
    const modal = App.initModal();

    // Community modal functionality
    const communityTriggers = Array.from(document.querySelectorAll("[data-community-trigger]"));
    const openCommunityModal = () => modal.open();
    communityTriggers.forEach((button) => button.addEventListener("click", openCommunityModal));

    // Contact message functionality
    const contactUsButton = document.getElementById("aboutContactUs");
    const contactUsCTA = document.getElementById("aboutContactUsCTA");

    const contactMessage = document.createElement("div");
    contactMessage.className = "about-contact-message";
    contactMessage.setAttribute("role", "status");
    contactMessage.setAttribute("aria-live", "polite");
    contactMessage.innerHTML = `
        <p class="about-contact-message__title">Need to reach us?</p>
        <p class="about-contact-message__body">Email us via our Gmail: <strong>HuIS2team-luminary@gmail.com</strong></p>
        <button type="button" class="about-contact-message__close">Okay, got it</button>
    `;
    document.body.appendChild(contactMessage);
    const contactMessageClose = contactMessage.querySelector(".about-contact-message__close");
    let contactMessageTimeout;

    const hideContactMessage = () => {
        contactMessage.classList.remove("is-visible");
    };

    const showContactMessage = () => {
        contactMessage.classList.add("is-visible");
        if (contactMessageTimeout) {
            clearTimeout(contactMessageTimeout);
        }
        contactMessageTimeout = window.setTimeout(hideContactMessage, 5000);
    };

    contactUsButton?.addEventListener("click", showContactMessage);
    contactUsCTA?.addEventListener("click", showContactMessage);
    contactMessageClose?.addEventListener("click", hideContactMessage);
    contactMessage.addEventListener("click", (event) => {
        if (event.target === contactMessage) hideContactMessage();
    });

    // Scroll animations
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.about-panel, .about-pillars__grid article, .about-showcase__grid article, .about-hero__stats article');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(element => {
            observer.observe(element);
        });
    };

    // Initialize animations on page load
    animateOnScroll();

    // Add hover effect to all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], .about-panel, .about-pillars__grid article, .about-showcase__grid article');
    
    interactiveElements.forEach(element => {
        // Skip if element already has a data-original-scale attribute
        if (element.hasAttribute('data-original-scale')) return;
        
        // Store original transform
        const originalTransform = window.getComputedStyle(element).transform;
        element.setAttribute('data-original-transform', originalTransform || 'none');
        
        // Add hover effect
        element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        
        element.addEventListener('mouseenter', () => {
            if (element.classList.contains('btn') || element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
                element.style.transform = `${originalTransform} translateY(-2px)`;
                element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            } else if (element.classList.contains('about-panel') || 
                      element.classList.contains('about-pillars__grid') || 
                      element.classList.contains('about-showcase__grid')) {
                element.style.transform = `${originalTransform} translateY(-5px)`;
                element.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            }
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = originalTransform;
            element.style.boxShadow = '';
        });
    });

    // Add pulse animation to CTA buttons
    const ctaButtons = document.querySelectorAll('.about-cta .btn');
    ctaButtons.forEach(button => {
        button.style.animation = 'pulse 2s infinite';
    });

    // Add gradient animation to hero title
    const heroTitle = document.querySelector('.about-hero h1');
    if (heroTitle) {
        heroTitle.style.background = 'linear-gradient(90deg, #0ea5e9, #10b981, #0ea5e9)';
        heroTitle.style.backgroundSize = '200% auto';
        heroTitle.style.webkitBackgroundClip = 'text';
        heroTitle.style.webkitTextFillColor = 'transparent';
        heroTitle.style.backgroundClip = 'text';
        heroTitle.style.animation = 'gradientBG 8s ease infinite';
    }
});


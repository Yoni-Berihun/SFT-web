document.addEventListener("DOMContentLoaded", () => {
    App.initPageShell();

    const modal = App.initModal();

    const communityTriggers = Array.from(document.querySelectorAll("[data-community-trigger]"));

    const openCommunityModal = () => modal.open();

    communityTriggers.forEach((button) => button.addEventListener("click", openCommunityModal));

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

});


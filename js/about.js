document.addEventListener("DOMContentLoaded", () => {
    App.initPageShell();

    // Initialize modal with close handlers
    const modal = App.initModal();

    const communityButton = document.getElementById("aboutCommunity");

    communityButton?.addEventListener("click", () => modal.open());
});


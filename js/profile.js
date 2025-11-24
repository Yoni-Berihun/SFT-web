document.addEventListener("DOMContentLoaded", () => {
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    // Initialize modal with close handlers
    const modal = App.initModal();

    const refs = {
        form: document.getElementById("profileForm"),
        nameInput: document.getElementById("profileName"),
        emailInput: document.getElementById("profileEmail"),
        budgetInput: document.getElementById("profileBudget"),
        currencySelect: document.getElementById("profileCurrency"),
        notificationsToggle: document.getElementById("profileNotifications"),
        avatarPreview: document.getElementById("profileAvatarPreview"),
        avatarInput: document.getElementById("profileAvatarInput"),
        removeAvatar: document.getElementById("removeAvatar"),
        resetButton: document.getElementById("profileReset"),
        exportButton: document.getElementById("profileExport"),
        clearDataButton: document.getElementById("clearData"),
        nameHeading: document.getElementById("profileNameHeading"),
        emailLabel: document.getElementById("profileEmailLabel"),
        modalOverlay: document.getElementById("modalOverlay"),
        modalClose: document.getElementById("modalClose"),
        exportContent: document.getElementById("profileExportContent"),
    };

    let user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);

    const renderProfile = () => {
        refs.nameInput.value = user.name;
        refs.emailInput.value = user.email;
        refs.budgetInput.value = user.budget;
        refs.currencySelect.value = user.currency;
        refs.notificationsToggle.checked = Boolean(user.notifications);
        refs.nameHeading.textContent = user.name;
        refs.emailLabel.textContent = user.email;
        refs.avatarPreview.textContent = user.name.charAt(0).toUpperCase();
        if (user.avatarBase64) {
            refs.avatarPreview.style.backgroundImage = `url(${user.avatarBase64})`;
            refs.avatarPreview.style.backgroundSize = "cover";
        } else {
            refs.avatarPreview.style.backgroundImage = "none";
        }
    };

    const persistUser = () => {
        App.saveState(App.STORAGE_KEYS.user, user);
        App.showToast("Profile updated");
        renderProfile();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        user = {
            ...user,
            name: refs.nameInput.value.trim() || App.defaultUser.name,
            email: refs.emailInput.value.trim() || App.defaultUser.email,
            budget: parseFloat(refs.budgetInput.value || "0"),
            currency: refs.currencySelect.value,
            notifications: refs.notificationsToggle.checked,
        };
        persistUser();
    };

    const resetForm = () => {
        user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
        renderProfile();
        App.showToast("Changes reverted");
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            user.avatarBase64 = e.target.result;
            persistUser();
        };
        reader.readAsDataURL(file);
    };

    const removeAvatar = () => {
        user.avatarBase64 = null;
        persistUser();
    };

    const exportProfile = () => {
        if (!refs.exportContent) return;
        refs.exportContent.value = JSON.stringify(user, null, 2);
        modal.open();
        if (refs.exportContent) refs.exportContent.select();
    };

    const closeModal = () => {
        modal.close();
    };

    const clearData = () => {
        [App.STORAGE_KEYS.user, App.STORAGE_KEYS.expenses, App.STORAGE_KEYS.friends, App.STORAGE_KEYS.split, App.STORAGE_KEYS.tips].forEach((key) =>
            App.removeState(key)
        );
        App.clearSession();
        user = App.clone(App.defaultUser);
        renderProfile();
        App.showToast("Local data cleared");
    };

    refs.form?.addEventListener("submit", handleSubmit);
    refs.avatarInput?.addEventListener("change", handleAvatarUpload);
    refs.removeAvatar?.addEventListener("click", removeAvatar);
    refs.resetButton?.addEventListener("click", resetForm);
    refs.exportButton?.addEventListener("click", exportProfile);
    refs.clearDataButton?.addEventListener("click", clearData);

    renderProfile();
});


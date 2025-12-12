document.addEventListener("DOMContentLoaded", () => {
    // Mark that we're not on an auth page
    window.__onAuthPage = false;
    
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    const modal = App.initModal();

    const refs = {
        form: document.getElementById("profileForm"),
        nameInput: document.getElementById("profileName"),
        emailInput: document.getElementById("profileEmail"),
        phoneInput: document.getElementById("profilePhone"),
        budgetInput: document.getElementById("profileBudget"),
        currencySelect: document.getElementById("profileCurrency"),
        studentIdInput: document.getElementById("profileStudentIdInput"),
        majorInput: document.getElementById("profileMajorInput"),
        semesterInput: document.getElementById("profileSemesterInput"),
        avatarPreview: document.getElementById("profileAvatarPreview"),
        basicAvatarPreview: document.getElementById("profileBasicAvatarPreview"),
        basicAvatarInput: document.getElementById("profileBasicAvatarInput"),
        profilePictureHelper: document.getElementById("profilePictureHelper"),
        resetButton: document.getElementById("profileReset"),
        exportJsonButton: document.getElementById("profileExportJson"),
        exportPdfButton: document.getElementById("profileExportPdf"),
        exportSummaryButton: document.getElementById("profileExportSummary"),
        clearDataButton: document.getElementById("clearData"),
        nameHeading: document.getElementById("profileNameHeading"),
        emailLabel: document.getElementById("profileEmailLabel"),
        phoneLabel: document.getElementById("profilePhoneLabel"),
        programLabel: document.getElementById("profileProgram"),
        studentId: document.getElementById("profileStudentId"),
        majorLabel: document.getElementById("profileMajor"),
        semesterLabel: document.getElementById("profileSemester"),
        overviewBalance: document.getElementById("overviewBalance"),
        overviewDues: document.getElementById("overviewDues"),
        overviewUpcoming: document.getElementById("overviewUpcoming"),
        overviewAid: document.getElementById("overviewAid"),
        transactionsTable: document.getElementById("profileTransactions"),
        transactionSearch: document.getElementById("transactionSearch"),
        transactionFilter: document.getElementById("transactionFilter"),
        documentsGrid: document.getElementById("profileDocuments"),
        obligationsList: document.getElementById("profileObligations"),
        uploadReceipt: document.getElementById("uploadReceipt"),
        exportContent: document.getElementById("profileExportContent"),
        modalCancel: document.getElementById("modalCancel"),
        changePasswordBtn: document.getElementById("changePasswordBtn"),
    };

    const loadUser = () => ({
        phone: "+251 900 000 000",
        ...App.loadState(App.STORAGE_KEYS.user, App.defaultUser),
    });

    let user = loadUser();

    const academicProfile = {
        studentId: "NACSR/0000/00",
        program: "BSc Computer Science · Year 3",
        major: "Information System",
        semester: "1",
    };

    const overviewSnapshot = {
        balance: 12500,
        dues: 3200,
        upcoming: 2100,
        aid: 8400,
    };

    const transactions = [
        { date: "2025-11-24", description: "Tuition installment", amount: -2500, method: "Bank transfer", status: "paid" },
        { date: "2025-11-22", description: "Dorm rent", amount: -1800, method: "Mobile money", status: "pending" },
        { date: "2025-11-19", description: "Scholarship disbursement", amount: 4500, method: "Wire", status: "paid" },
        { date: "2025-11-17", description: "Internet bundle", amount: -320, method: "Card", status: "paid" },
        { date: "2025-11-14", description: "Lab fee", amount: -900, method: "Cash", status: "overdue" },
    ];

    const obligations = [
        { title: "Dorm rent", due: "Dec 01", amount: 1800, status: "pending" },
        { title: "Lab fee", due: "Nov 28", amount: 900, status: "overdue" },
        { title: "Scholarship release", due: "Nov 30", amount: 4500, status: "paid" },
    ];

    const budgets = [
        { category: "Tuition", spent: 8200, limit: 10000 },
        { category: "Housing", spent: 4200, limit: 4800 },
        { category: "Food", spent: 1500, limit: 2200 },
        { category: "Transport", spent: 600, limit: 900 },
        { category: "Books", spent: 980, limit: 1500 },
        { category: "Personal", spent: 750, limit: 1200 },
    ];

    const documents = [
        { title: "Tuition invoice — Nov", type: "Invoice", size: "1.2 MB" },
        { title: "Dorm receipt — Oct", type: "Receipt", size: "640 KB" },
        { title: "Aid letter", type: "PDF", size: "420 KB" },
    ];

    const notifications = [
        { icon: "📅", title: "Tuition balance due Dec 3", detail: "Pay via bank transfer to avoid late fee", status: "pending" },
        { icon: "🎓", title: "Scholarship released", detail: "ETB 4,500 credited to account", status: "success" },
        { icon: "⚠️", title: "Dorm rent overdue", detail: "ETB 1,800 outstanding for November", status: "risk" },
    ];

    const renderProfile = () => {
        refs.nameInput.value = user.name;
        refs.emailInput.value = user.email;
        refs.phoneInput.value = user.phone || "";
        refs.budgetInput.value = user.budget;
        refs.currencySelect.value = user.currency;
        if (refs.studentIdInput) refs.studentIdInput.value = academicProfile.studentId;
        if (refs.majorInput) refs.majorInput.value = academicProfile.major;
        if (refs.semesterInput) refs.semesterInput.value = academicProfile.semester;
        refs.notificationsToggle.checked = Boolean(user.notifications);
        refs.nameHeading.textContent = user.name;
        refs.emailLabel.textContent = user.email;
        refs.phoneLabel.textContent = user.phone || "+251 900 000 000";
        refs.programLabel.textContent = academicProfile.program;
        refs.studentId.textContent = academicProfile.studentId;
        refs.majorLabel.textContent = academicProfile.major;
        refs.semesterLabel.textContent = `Semester ${academicProfile.semester}`;
        
        // Update hero avatar
        const avatarInitial = user.name.charAt(0).toUpperCase();
        if (user.avatarBase64) {
            refs.avatarPreview.style.backgroundImage = `url(${user.avatarBase64})`;
            refs.avatarPreview.style.backgroundSize = "cover";
            refs.avatarPreview.style.backgroundPosition = "center";
            refs.avatarPreview.style.backgroundRepeat = "no-repeat";
            refs.avatarPreview.textContent = "";
            refs.avatarPreview.style.color = "transparent";
        } else {
            refs.avatarPreview.style.backgroundImage = "none";
            refs.avatarPreview.style.backgroundPosition = "center";
            refs.avatarPreview.style.backgroundRepeat = "no-repeat";
            refs.avatarPreview.textContent = avatarInitial;
            refs.avatarPreview.style.color = "white";
        }
        
        // Update basic profile avatar preview
        if (refs.basicAvatarPreview) {
            const initialSpan = refs.basicAvatarPreview.querySelector('.avatar-initial');
            if (user.avatarBase64) {
                refs.basicAvatarPreview.style.backgroundImage = `url(${user.avatarBase64})`;
                refs.basicAvatarPreview.style.backgroundSize = "cover";
                refs.basicAvatarPreview.style.backgroundPosition = "center";
                refs.basicAvatarPreview.style.backgroundRepeat = "no-repeat";
                if (initialSpan) initialSpan.style.display = 'none';
            } else {
                refs.basicAvatarPreview.style.backgroundImage = "none";
                refs.basicAvatarPreview.style.backgroundPosition = "center";
                refs.basicAvatarPreview.style.backgroundRepeat = "no-repeat";
                if (initialSpan) {
                    initialSpan.textContent = avatarInitial;
                    initialSpan.style.display = 'flex';
                }
            }
        }
    };

    const persistUser = () => {
        App.saveState(App.STORAGE_KEYS.user, user);
        App.showToast("Profile updated");
        renderProfile();
        renderBasicDetails();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        user = {
            ...user,
            name: refs.nameInput.value.trim() || App.defaultUser.name,
            email: refs.emailInput.value.trim() || App.defaultUser.email,
            phone: refs.phoneInput.value.trim() || user.phone,
            budget: parseFloat(refs.budgetInput.value || "0"),
            currency: refs.currencySelect.value,
            notifications: refs.notificationsToggle.checked,
        };
        // Update academic profile if fields exist
        if (refs.studentIdInput) academicProfile.studentId = refs.studentIdInput.value.trim() || academicProfile.studentId;
        if (refs.majorInput) academicProfile.major = refs.majorInput.value.trim() || academicProfile.major;
        if (refs.semesterInput) academicProfile.semester = refs.semesterInput.value.trim() || academicProfile.semester;
        persistUser();
    };

    const resetForm = () => {
        user = loadUser();
        renderProfile();
        renderBasicDetails();
        App.showToast("Changes reverted");
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            App.showToast("Please select an image file");
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            App.showToast("Image size must be less than 5MB");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Automatically save the image when selected
            user.avatarBase64 = e.target.result;
            persistUser();
            // Force immediate update of avatars
            if (refs.avatarPreview) {
                refs.avatarPreview.style.backgroundImage = `url(${user.avatarBase64})`;
                refs.avatarPreview.style.backgroundSize = "cover";
                refs.avatarPreview.style.backgroundPosition = "center";
                refs.avatarPreview.style.backgroundRepeat = "no-repeat";
                refs.avatarPreview.textContent = "";
                refs.avatarPreview.style.color = "transparent";
            }
            if (refs.basicAvatarPreview) {
                refs.basicAvatarPreview.style.backgroundImage = `url(${user.avatarBase64})`;
                refs.basicAvatarPreview.style.backgroundSize = "cover";
                refs.basicAvatarPreview.style.backgroundPosition = "center";
                refs.basicAvatarPreview.style.backgroundRepeat = "no-repeat";
                const initialSpan = refs.basicAvatarPreview.querySelector('.avatar-initial');
                if (initialSpan) initialSpan.style.display = 'none';
            }
            renderProfile();
            App.showToast("Profile picture uploaded successfully!");
        };
        reader.onerror = () => {
            App.showToast("Error reading image file");
        };
        reader.readAsDataURL(file);
    };

    const removeAvatar = () => {
        user.avatarBase64 = null;
        persistUser();
    };

    const renderOverview = () => {
        refs.overviewBalance.textContent = App.formatCurrency(overviewSnapshot.balance, user.currency);
        refs.overviewDues.textContent = App.formatCurrency(overviewSnapshot.dues, user.currency);
        refs.overviewUpcoming.textContent = App.formatCurrency(overviewSnapshot.upcoming, user.currency);
        refs.overviewAid.textContent = App.formatCurrency(overviewSnapshot.aid, user.currency);
    };

    const renderBasicDetails = () => {
        const list = document.getElementById("profileBasicDetails");
        if (!list) return;
        list.innerHTML = `
            <div>
                <dt>Full name</dt>
                <dd>${user.name}</dd>
            </div>
            <div>
                <dt>Email</dt>
                <dd>${user.email}</dd>
            </div>
            <div>
                <dt>Phone</dt>
                <dd>${user.phone || "+251 900 000 000"}</dd>
            </div>
            <div>
                <dt>Monthly budget</dt>
                <dd>${App.formatCurrency(user.budget || 0, user.currency)}</dd>
            </div>
            <div>
                <dt>Preferred currency</dt>
                <dd>${user.currency}</dd>
            </div>
        `;
    };

    const renderObligations = () => {
        if (!refs.obligationsList) return;
        refs.obligationsList.innerHTML = obligations
            .map(
                (item) => `
            <li class="profile-obligations__item">
                <div>
                    <strong>${item.title}</strong>
                    <p class="helper-text">Due ${item.due}</p>
                </div>
                <div class="profile-obligations__meta">
                    <span class="status-chip ${item.status}">${item.status.toUpperCase()}</span>
                    <p>${App.formatCurrency(item.amount, user.currency)}</p>
                </div>
            </li>`
            )
            .join("");
    };

    const renderTransactions = () => {
        if (!refs.transactionsTable) return;
        const term = refs.transactionSearch?.value?.toLowerCase() || "";
        const filter = refs.transactionFilter?.value || "all";
        const filtered = transactions.filter((tx) => {
            const matchesTerm =
                !term ||
                tx.description.toLowerCase().includes(term) ||
                tx.method.toLowerCase().includes(term);
            const matchesStatus = filter === "all" || tx.status === filter;
            return matchesTerm && matchesStatus;
        });
        refs.transactionsTable.innerHTML = filtered
            .map(
                (tx) => `
            <tr>
                <td>${tx.date}</td>
                <td>${tx.description}</td>
                <td>${App.formatCurrency(tx.amount, user.currency)}</td>
                <td>${tx.method}</td>
                <td><span class="status-chip ${tx.status}">${tx.status.toUpperCase()}</span></td>
            </tr>`
            )
            .join("");
    };

    const renderDocuments = () => {
        if (!refs.documentsGrid) return;
        refs.documentsGrid.innerHTML = documents
            .map(
                (doc) => `
                <article class="profile-document">
                    <strong>${doc.title}</strong>
                    <p class="helper-text">${doc.type} · ${doc.size}</p>
                    <div class="profile-card__actions">
                        <button class="btn btn-ghost" type="button">Preview</button>
                        <button class="btn btn-secondary" type="button">Download</button>
                    </div>
                </article>`
            )
            .join("");
    };


    const exportProfileJson = () => {
        if (!refs.exportContent) return;
        refs.exportContent.value = JSON.stringify(user, null, 2);
        modal.open();
        refs.exportContent.select();
    };

    const exportSummaryCsv = () => {
        const rows = [
            ["Metric", "Amount"],
            ["Balance", overviewSnapshot.balance],
            ["Dues", overviewSnapshot.dues],
            ["Upcoming", overviewSnapshot.upcoming],
            ["Aid", overviewSnapshot.aid],
        ];
        const csv = rows.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "profile-summary.csv";
        link.click();
        URL.revokeObjectURL(url);
        App.showToast("Summary exported");
    };

    const scrollToForm = () => {
        refs.form?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const clearData = () => {
        [App.STORAGE_KEYS.user, App.STORAGE_KEYS.expenses, App.STORAGE_KEYS.friends, App.STORAGE_KEYS.split, App.STORAGE_KEYS.tips].forEach((key) =>
            App.removeState(key)
        );
        App.clearSession();
        user = loadUser();
        renderProfile();
        renderBasicDetails();
        App.showToast("Local data cleared");
    };

    refs.form?.addEventListener("submit", handleSubmit);
    refs.basicAvatarInput?.addEventListener("change", handleAvatarUpload);
    refs.resetButton?.addEventListener("click", resetForm);
    refs.exportJsonButton?.addEventListener("click", exportProfileJson);
    refs.exportSummaryButton?.addEventListener("click", exportSummaryCsv);
    refs.exportPdfButton?.addEventListener("click", exportSummaryCsv);
    refs.clearDataButton?.addEventListener("click", clearData);
    refs.modalCancel?.addEventListener("click", () => modal.close());
    refs.transactionSearch?.addEventListener("input", renderTransactions);
    refs.transactionFilter?.addEventListener("change", renderTransactions);
    document.getElementById("profileEditTrigger")?.addEventListener("click", scrollToForm);
    document.getElementById("profileEditSecondary")?.addEventListener("click", scrollToForm);
    refs.uploadReceipt?.addEventListener("click", () => App.showToast("Upload coming soon"));
    refs.changePasswordBtn?.addEventListener("click", () => App.showToast("Password change feature coming soon"));

    renderProfile();
    renderOverview();
    renderBasicDetails();
    renderObligations();
    renderTransactions();
    renderDocuments();
});


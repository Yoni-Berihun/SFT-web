document.addEventListener("DOMContentLoaded", () => {
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    // Initialize modal with close handlers
    const modal = App.initModal();

    const refs = {
        form: document.getElementById("splitForm"),
        description: document.getElementById("splitDescription"),
        amount: document.getElementById("splitAmount"),
        participants: document.getElementById("splitParticipants"),
        list: document.getElementById("splitList"),
        resetButton: document.getElementById("splitReset"),
        modalOverlay: document.getElementById("modalOverlay"),
        modalClose: document.getElementById("modalClose"),
        modalContent: document.getElementById("modalContent"),
    };

    let splits = App.loadState(App.STORAGE_KEYS.split, App.defaultSplitExpenses);
    const user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    const friends = App.defaultSplitFriends.reduce(
        (map, friend) => ({ ...map, [friend.id]: friend.name }),
        { me: "You" }
    );

    const saveSplits = () => {
        App.saveState(App.STORAGE_KEYS.split, splits);
    };

    const participantNames = (ids) => ids.map((id) => friends[id] || id).join(", ");

    const openModal = (split) => {
        if (!refs.modalContent) return;
        const shareText = `${split.description} — ${App.formatCurrency(split.totalAmount, user.currency)} shared by ${participantNames(split.splitBetween)}`;
        refs.modalContent.innerHTML = `<p>${shareText}</p>`;
        modal.open();
    };

    const closeModal = () => {
        modal.close();
    };

    const renderSplits = () => {
        if (!refs.list) return;
        refs.list.innerHTML = "";
        if (!splits.length) {
            const empty = document.createElement("li");
            empty.textContent = "No split expenses yet.";
            refs.list.appendChild(empty);
            return;
        }
        splits
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach((split) => {
                const item = document.createElement("li");
                item.innerHTML = `
                    <strong>${split.description}</strong>
                    <span>${App.formatCurrency(split.totalAmount, user.currency)} — shared by ${participantNames(split.splitBetween)}</span>
                    <div class="split-actions">
                        <button class="btn btn-tertiary" data-split-view="${split.id}">View</button>
                        <button class="btn btn-danger" data-split-delete="${split.id}">Settle</button>
                    </div>
                `;
                refs.list.appendChild(item);
            });
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        const participantOptions = Array.from(refs.participants.selectedOptions).map((option) => option.value);
        if (!participantOptions.length) {
            App.showToast("Select at least one participant");
            return;
        }
        const amount = parseFloat(refs.amount.value || "0");
        if (!amount || amount <= 0) {
            App.showToast("Enter a valid amount");
            return;
        }
        const split = {
            id: `split-${Date.now()}`,
            description: refs.description.value.trim() || "Shared expense",
            totalAmount: amount,
            splitBetween: participantOptions,
            date: new Date().toISOString().split("T")[0],
            settled: false,
        };
        splits = [split, ...splits];
        saveSplits();
        renderSplits();
        refs.form.reset();
        App.showToast("Split created");
    };

    const handleListClick = (event) => {
        const viewId = event.target.closest("button")?.dataset.splitView;
        const deleteId = event.target.closest("button")?.dataset.splitDelete;
        if (viewId) {
            const split = splits.find((item) => item.id === viewId);
            if (split) openModal(split);
        } else if (deleteId) {
            splits = splits.filter((item) => item.id !== deleteId);
            saveSplits();
            renderSplits();
            App.showToast("Split settled");
        }
    };

    const restoreDemo = () => {
        splits = App.clone(App.defaultSplitExpenses);
        saveSplits();
        renderSplits();
        App.showToast("Demo splits restored");
    };

    refs.form?.addEventListener("submit", handleFormSubmit);
    refs.list?.addEventListener("click", handleListClick);
    refs.resetButton?.addEventListener("click", restoreDemo);

    renderSplits();
});


document.addEventListener("DOMContentLoaded", () => {
    
    window.__onAuthPage = false;
    
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    // Initialize modal with close handlers
    const modal = App.initModal();

    const els = {
        list: document.getElementById("tipsList"),
        progressLabel: document.getElementById("tipsProgressLabel"),
        progressBar: document.getElementById("tipsProgressBar"),
        completeNext: document.getElementById("tipsCompleteNext"),
        reset: document.getElementById("tipsResetProgress"),
        quote: document.getElementById("tipsQuote"),
        quoteAuthor: document.getElementById("tipsQuoteAuthor"),
        modalOverlay: document.getElementById("modalOverlay"),
        modalClose: document.getElementById("modalClose"),
        modalContent: document.getElementById("modalContent"),
    };

    const quotes = [
        { text: "A budget is a permission slip for joyful spending.", author: "Yonatan Berihun" },
        { text: "Small, regular contributions compound into surprising balances.", author: "Abdulkerim khedr" },
        { text: "Paying yourself first is the simplest habit that builds wealth.", author: "Biniyam Fisseha" },
        { text: "Build wealth quietly, let your freedom make the noise", author: "Tsion Tesfaye" },
        { text: "Know your why: every savings plan needs a purpose.", author: "Fenet Bushura" },
        { text: "Track one thing this week — spending, saving, or subscription use.", author: "Amanuel wondmagegnehu" },
        { text: "Automate the boring stuff: transfers and bills free your attention.", author: "Elham Seid" },
        { text: "Spend wisely… or just keep refreshing your balance sadly", author: "Afomiya Million" },
    ];

    let quoteIndex = 0;

    const tipsState = App.loadState(App.STORAGE_KEYS.tips, { progress: {} });

    const saveTips = () => {
        App.saveState(App.STORAGE_KEYS.tips, tipsState);
    };

    const completedCount = () => Object.values(tipsState.progress).filter(Boolean).length;

    const updateProgress = () => {
        const total = App.defaultTips.length;
        const done = completedCount();
        const percent = total ? Math.round((done / total) * 100) : 0;
        if (els.progressLabel) els.progressLabel.textContent = `${done} of ${total} complete`;
        if (els.progressBar) els.progressBar.style.width = `${percent}%`;
    };

    const openTipModal = (tip) => {
        if (!els.modalContent) return;
        els.modalContent.innerHTML = `
            <p><strong>${tip.title}</strong></p>
            <p>${tip.preview}</p>
            <ul>${tip.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
        `;
        modal.open();
    };

    const closeModal = () => {
        modal.close();
    };

    const renderTips = () => {
        if (!els.list) return;
        els.list.innerHTML = "";
        App.defaultTips.forEach((tip) => {
            const card = document.createElement("article");
            card.innerHTML = `
                <span class="big-number" aria-hidden="true">${tip.icon}</span>
                <h3>${tip.title}</h3>
                <p>${tip.preview}</p>
                <ul>${tip.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
                <div class="tips-card__actions">
                    <button class="btn btn-tertiary" data-tip-view="${tip.id}">View details</button>
                </div>
            `;
            els.list.appendChild(card);
        });
    };

    const toggleComplete = (tipId) => {
        tipsState.progress[tipId] = !tipsState.progress[tipId];
        saveTips();
        updateProgress();
        renderTips();
        App.showToast(tipsState.progress[tipId] ? "Challenge completed" : "Challenge reopened");
    };

    const handleListClick = (event) => {
        const completeId = event.target.closest("button")?.dataset.tipComplete;
        const viewId = event.target.closest("button")?.dataset.tipView;
        if (completeId) {
            toggleComplete(completeId);
        } else if (viewId) {
            const tip = App.defaultTips.find((item) => item.id === viewId);
            if (tip) openTipModal(tip);
        }
    };

    const completeNext = () => {
        const nextTip = App.defaultTips.find((tip) => !tipsState.progress[tip.id]);
        if (!nextTip) {
            App.showToast("All challenges already complete!");
            return;
        }
        toggleComplete(nextTip.id);
        const card = els.list?.querySelector(`[data-tip-complete="${nextTip.id}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const resetProgress = () => {
        tipsState.progress = {};
        saveTips();
        renderTips();
        updateProgress();
        App.showToast("Progress reset");
    };

    const rotateQuote = () => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        if (els.quote) els.quote.textContent = quotes[quoteIndex].text;
        if (els.quoteAuthor) els.quoteAuthor.textContent = quotes[quoteIndex].author;
    };

    els.completeNext?.addEventListener("click", completeNext);
    els.reset?.addEventListener("click", resetProgress);
    els.list?.addEventListener("click", handleListClick);

    renderTips();
    updateProgress();
    setInterval(rotateQuote, 6000);
});


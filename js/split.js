<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
    // Mark that we're not on an auth page
    window.__onAuthPage = false;
    
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    const refs = {
        form: document.getElementById("splitForm"),
        amount: document.getElementById("splitAmount"),
        peopleInput: document.getElementById("splitPeople"),
        participantsContainer: document.getElementById("splitParticipantsContainer"),
        shareAmount: document.getElementById("splitShareAmount"),
        peopleLabel: document.getElementById("splitPeopleLabel"),
        totalLabel: document.getElementById("splitTotalLabel"),
        breakdownList: document.getElementById("splitBreakdownList"),
        remainder: document.getElementById("splitRemainder"),
        shareButton: document.getElementById("splitShareSummary"),
        shareMenu: document.getElementById("splitShareMenu"),
        chartCanvas: document.getElementById("splitChart"),
        statusChartCanvas: document.getElementById("splitStatusChart"),
    };
    const quickAmountButtons = Array.from(document.querySelectorAll("[data-quick-amount]"));
    const quickPeopleButtons = Array.from(document.querySelectorAll("[data-quick-people]"));

    const user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    const formatCurrency = (value) => App.formatCurrency(value, user.currency);

    let participants = [];
    let chartInstance = null;
    let statusChartInstance = null;

    const createParticipant = (index, existing = {}) => ({
        id: existing.id || `participant-${index + 1}`,
        name: existing.name || `Person ${index + 1}`,
        weight: existing.weight ?? 10,
        status: existing.status || "pending",
    });

    const syncParticipantCount = (count) => {
        const current = participants.slice(0, count);
        while (current.length < count) {
            current.push(createParticipant(current.length));
        }
        participants = current;
        renderParticipants();
        renderResults();
    };

    const renderParticipants = () => {
        if (!refs.participantsContainer) return;
        refs.participantsContainer.innerHTML = participants
            .map(
                (participant, index) => `
            <div class="split-participant" data-id="${participant.id}">
                <div class="split-participant__row">
                    <div class="split-participant__avatar">${(participant.name || `P${index + 1}`).charAt(0).toUpperCase()}</div>
                    <input type="text" value="${participant.name}" data-field="name" placeholder="Name (optional)" />
                </div>
                <div class="split-participant__controls">
                    <div class="split-participant__slider">
                        <label>Share weight <span data-weight-display>${participant.weight}</span></label>
                        <input type="range" min="1" max="100" value="${participant.weight}" data-field="weight" />
                    </div>
                    <div class="split-participant__meta">
                        <label>
                            Status
                            <select data-field="status">
                                <option value="pending" ${participant.status === "pending" ? "selected" : ""}>Pending</option>
                                <option value="paid" ${participant.status === "paid" ? "selected" : ""}>Paid</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>`
            )
            .join("");

        refs.participantsContainer.querySelectorAll("input, select").forEach((element) => {
            const parent = element.closest(".split-participant");
            const participantId = parent?.dataset.id;
            if (!participantId) return;
            element.addEventListener("input", () => {
                const target = participants.find((item) => item.id === participantId);
                if (!target) return;
                if (element.dataset.field === "name") {
                    target.name = element.value || target.name;
                    parent.querySelector(".split-participant__avatar").textContent = (target.name || "P").charAt(0).toUpperCase();
                } else if (element.dataset.field === "weight") {
                    target.weight = Number(element.value) || 1;
                    parent.querySelector("[data-weight-display]").textContent = target.weight;
                } else if (element.dataset.field === "status") {
                    target.status = element.value;
                }
                renderResults();
            });
        });
    };

    const getSplitResults = () => {
        const total = parseFloat(refs.amount.value || "0");
        if (!total || total <= 0 || !participants.length) {
            return { total, people: participants.length, entries: [], share: 0, remainder: 0 };
        }
        const baseWeights = participants.map((participant) => Math.max(1, Number(participant.weight) || 1));
        const sumWeights = baseWeights.reduce((sum, weight) => sum + weight, 0) || baseWeights.length;

        const rawShares = baseWeights.map((weight) => (total * weight) / sumWeights);
        const adjustedShares = rawShares.map((share) => Math.round(share * 100) / 100);
        const adjustedTotal = adjustedShares.reduce((sum, share) => sum + share, 0);
        const remainder = Math.round((total - adjustedTotal) * 100) / 100;
        if (Math.abs(remainder) >= 0.01) {
            adjustedShares[adjustedShares.length - 1] = Math.round((adjustedShares[adjustedShares.length - 1] + remainder) * 100) / 100;
        }

        const entries = participants.map((participant, index) => ({
            ...participant,
            amount: adjustedShares[index],
        }));

        return {
            total,
            people: participants.length,
            entries,
            share: adjustedShares[0] || 0,
            remainder,
        };
    };

    const renderCharts = (entries) => {
        if (typeof Chart === "undefined") return;
        if ((!refs.chartCanvas && chartInstance) || (!refs.statusChartCanvas && statusChartInstance)) {
            chartInstance?.destroy();
            statusChartInstance?.destroy();
            return;
        }
        const palette = ["#00C9A7", "#FFB347", "#6C63FF", "#FF6F91", "#36B5FF", "#F67280", "#A3A1FB", "#F8B400", "#34D399"];
        const data = entries.map((entry) => entry.amount);
        const labels = entries.map((entry) => entry.name);
        chartInstance?.destroy();
        if (refs.chartCanvas) {
            chartInstance = new Chart(refs.chartCanvas.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: data.map((_, index) => palette[index % palette.length]),
                            borderWidth: 3,
                            hoverOffset: 12,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                    },
                    plugins: {
                        legend: { position: "bottom" },
                    },
                },
            });
        }

        statusChartInstance?.destroy();
        if (refs.statusChartCanvas) {
            const statusTotals = entries.reduce(
                (acc, entry) => {
                    acc[entry.status] = (acc[entry.status] || 0) + entry.amount;
                    return acc;
                },
                { pending: 0, paid: 0 }
            );
            statusChartInstance = new Chart(refs.statusChartCanvas.getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Paid", "Pending"],
                    datasets: [
                        {
                            data: [statusTotals.paid || 0, statusTotals.pending || 0],
                            backgroundColor: ["rgba(16, 185, 129, 0.6)", "rgba(245, 158, 11, 0.6)"],
                            borderColor: ["#10B981", "#F59E0B"],
                            borderWidth: 2,
                            borderRadius: 8,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        delay: (context) => context.dataIndex * 120,
                    },
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: "rgba(15, 23, 42, 0.06)" },
                        },
                        x: {
                            grid: { display: false },
                        },
                    },
                },
            });
        }
    };

    const renderResults = () => {
        if (!refs.shareAmount || !refs.breakdownList) return;
        const result = getSplitResults();
        if (!result.entries.length) {
            refs.shareAmount.textContent = formatCurrency(0);
            refs.peopleLabel.textContent = "0";
            refs.totalLabel.textContent = formatCurrency(0);
            refs.breakdownList.innerHTML = "";
            refs.remainder.hidden = true;
            chartInstance?.destroy();
            statusChartInstance?.destroy();
            return;
        }

        refs.shareAmount.textContent = formatCurrency(result.share);
        refs.peopleLabel.textContent = result.people.toString();
        refs.totalLabel.textContent = formatCurrency(result.total);

        refs.breakdownList.innerHTML = result.entries
            .map(
                (entry) => `
            <li>
                <div>
                    <strong>${entry.name}</strong>
                    <p class="helper-text">${entry.status === "paid" ? "Already paid" : "Needs to pay"}</p>
                </div>
                <div>
                    <span class="status-chip ${entry.status}">${entry.status.toUpperCase()}</span>
                    <strong>${formatCurrency(entry.amount)}</strong>
                </div>
            </li>`
            )
            .join("");

        if (result.remainder !== 0) {
            refs.remainder.hidden = false;
            refs.remainder.textContent = `Precision tweak: last entry adjusted by ${formatCurrency(result.remainder)} so the total stays exact.`;
        } else {
            refs.remainder.hidden = true;
        }

        renderCharts(result.entries);
    };

    const buildShareSummary = () => {
        const result = getSplitResults();
        if (!result.entries.length) return null;
        const breakdown = result.entries.map((entry) => `${entry.name}: ${formatCurrency(entry.amount)} (${entry.status})`).join("; ");
        return `Split summary — total ${formatCurrency(result.total)} across ${result.people} people. ${breakdown}.`;
    };

    const shareSummary = (mode) => {
        const summary = buildShareSummary();
        if (!summary) {
            App.showToast("Calculate a split first");
            return;
        }
        const encoded = encodeURIComponent(summary);
        if (mode === "whatsapp") {
            window.open(`https://wa.me/?text=${encoded}`, "_blank");
        } else if (mode === "telegram") {
            window.open(`https://t.me/share/url?text=${encoded}`, "_blank");
        } else if (mode === "instagram") {
            App.showToast("Instagram sharing works via native share sheet");
        } else if (mode === "email") {
            window.open(`mailto:?subject=EduFinance split&body=${encoded}`, "_blank");
        } else if (mode === "sms") {
            window.location.href = `sms:?&body=${encoded}`;
        } else {
            navigator.clipboard
                ?.writeText(summary)
                .then(() => App.showToast("Summary copied"))
                .catch(() => App.showToast(summary));
        }
        toggleShareMenu(false);
    };

    const toggleShareMenu = (force) => {
        if (!refs.shareMenu || !refs.shareButton) return;
        const willShow = typeof force === "boolean" ? force : refs.shareMenu.hidden;
        refs.shareMenu.hidden = !willShow;
        refs.shareButton.setAttribute("aria-expanded", String(willShow));
    };

    refs.form?.addEventListener("submit", (event) => {
        event.preventDefault();
        renderResults();
        refs.form.classList.add("is-active");
        setTimeout(() => refs.form.classList.remove("is-active"), 400);
    });

    refs.amount?.addEventListener("input", renderResults);
    refs.peopleInput?.addEventListener("input", () => {
        const count = Math.min(25, Math.max(1, Number(refs.peopleInput.value) || 1));
        syncParticipantCount(count);
    });
    refs.shareButton?.addEventListener("click", () => toggleShareMenu());
    refs.shareMenu?.addEventListener("click", (event) => {
        const action = event.target.closest("[data-share]")?.dataset.share;
        if (!action) return;
        shareSummary(action);
    });
    document.addEventListener("click", (event) => {
        if (!refs.shareMenu || refs.shareMenu.hidden) return;
        if (event.target.closest(".share-control")) return;
        toggleShareMenu(false);
    });

    const markActiveButton = (buttonGroup, activeButton) => {
        buttonGroup.forEach((button) => button.classList.toggle("is-active", button === activeButton));
    };

    quickAmountButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const value = Number(button.dataset.quickAmount);
            if (!value) return;
            refs.amount.value = value;
            renderResults();
            markActiveButton(quickAmountButtons, button);
        });
    });

    quickPeopleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const count = Number(button.dataset.quickPeople);
            if (!count) return;
            refs.peopleInput.value = count;
            syncParticipantCount(count);
            markActiveButton(quickPeopleButtons, button);
        });
    });

    syncParticipantCount(Number(refs.peopleInput.value || 1));
    renderResults();
});

=======
document.addEventListener("DOMContentLoaded", () => {
    // Mark that we're not on an auth page
    window.__onAuthPage = false;
    
    if (!App.initPageShell({ auth: true })) {
        return;
    }

    const refs = {
        form: document.getElementById("splitForm"),
        amount: document.getElementById("splitAmount"),
        peopleInput: document.getElementById("splitPeople"),
        participantsContainer: document.getElementById("splitParticipantsContainer"),
        shareAmount: document.getElementById("splitShareAmount"),
        peopleLabel: document.getElementById("splitPeopleLabel"),
        totalLabel: document.getElementById("splitTotalLabel"),
        breakdownList: document.getElementById("splitBreakdownList"),
        remainder: document.getElementById("splitRemainder"),
        shareButton: document.getElementById("splitShareSummary"),
        shareMenu: document.getElementById("splitShareMenu"),
        chartCanvas: document.getElementById("splitChart"),
        statusChartCanvas: document.getElementById("splitStatusChart"),
    };
    const quickAmountButtons = Array.from(document.querySelectorAll("[data-quick-amount]"));
    const quickPeopleButtons = Array.from(document.querySelectorAll("[data-quick-people]"));

    const user = App.loadState(App.STORAGE_KEYS.user, App.defaultUser);
    const formatCurrency = (value) => App.formatCurrency(value, user.currency);

    let participants = [];
    let chartInstance = null;
    let statusChartInstance = null;

    const createParticipant = (index, existing = {}) => ({
        id: existing.id || `participant-${index + 1}`,
        name: existing.name || `Person ${index + 1}`,
        weight: existing.weight ?? 10,
        status: existing.status || "pending",
    });

    const syncParticipantCount = (count) => {
        const current = participants.slice(0, count);
        while (current.length < count) {
            current.push(createParticipant(current.length));
        }
        participants = current;
        renderParticipants();
        renderResults();
    };

    const renderParticipants = () => {
        if (!refs.participantsContainer) return;
        refs.participantsContainer.innerHTML = participants
            .map(
                (participant, index) => `
            <div class="split-participant" data-id="${participant.id}">
                <div class="split-participant__row">
                    <div class="split-participant__avatar">${(participant.name || `P${index + 1}`).charAt(0).toUpperCase()}</div>
                    <input type="text" value="${participant.name}" data-field="name" placeholder="Name (optional)" />
                </div>
                <div class="split-participant__controls">
                    <div class="split-participant__slider">
                        <label>Share weight <span data-weight-display>${participant.weight}</span></label>
                        <input type="range" min="1" max="100" value="${participant.weight}" data-field="weight" />
                    </div>
                    <div class="split-participant__meta">
                        <label>
                            Status
                            <select data-field="status">
                                <option value="pending" ${participant.status === "pending" ? "selected" : ""}>Pending</option>
                                <option value="paid" ${participant.status === "paid" ? "selected" : ""}>Paid</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>`
            )
            .join("");

        refs.participantsContainer.querySelectorAll("input, select").forEach((element) => {
            const parent = element.closest(".split-participant");
            const participantId = parent?.dataset.id;
            if (!participantId) return;
            element.addEventListener("input", () => {
                const target = participants.find((item) => item.id === participantId);
                if (!target) return;
                if (element.dataset.field === "name") {
                    target.name = element.value || target.name;
                    parent.querySelector(".split-participant__avatar").textContent = (target.name || "P").charAt(0).toUpperCase();
                } else if (element.dataset.field === "weight") {
                    target.weight = Number(element.value) || 1;
                    parent.querySelector("[data-weight-display]").textContent = target.weight;
                } else if (element.dataset.field === "status") {
                    target.status = element.value;
                }
                renderResults();
            });
        });
    };

    const getSplitResults = () => {
        const total = parseFloat(refs.amount.value || "0");
        if (!total || total <= 0 || !participants.length) {
            return { total, people: participants.length, entries: [], share: 0, remainder: 0 };
        }
        const baseWeights = participants.map((participant) => Math.max(1, Number(participant.weight) || 1));
        const sumWeights = baseWeights.reduce((sum, weight) => sum + weight, 0) || baseWeights.length;

        const rawShares = baseWeights.map((weight) => (total * weight) / sumWeights);
        const adjustedShares = rawShares.map((share) => Math.round(share * 100) / 100);
        const adjustedTotal = adjustedShares.reduce((sum, share) => sum + share, 0);
        const remainder = Math.round((total - adjustedTotal) * 100) / 100;
        if (Math.abs(remainder) >= 0.01) {
            adjustedShares[adjustedShares.length - 1] = Math.round((adjustedShares[adjustedShares.length - 1] + remainder) * 100) / 100;
        }

        const entries = participants.map((participant, index) => ({
            ...participant,
            amount: adjustedShares[index],
        }));

        return {
            total,
            people: participants.length,
            entries,
            share: adjustedShares[0] || 0,
            remainder,
        };
    };

    const renderCharts = (entries) => {
        if (typeof Chart === "undefined") return;
        if ((!refs.chartCanvas && chartInstance) || (!refs.statusChartCanvas && statusChartInstance)) {
            chartInstance?.destroy();
            statusChartInstance?.destroy();
            return;
        }
        const palette = ["#00C9A7", "#FFB347", "#6C63FF", "#FF6F91", "#36B5FF", "#F67280", "#A3A1FB", "#F8B400", "#34D399"];
        const data = entries.map((entry) => entry.amount);
        const labels = entries.map((entry) => entry.name);
        chartInstance?.destroy();
        if (refs.chartCanvas) {
            chartInstance = new Chart(refs.chartCanvas.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: data.map((_, index) => palette[index % palette.length]),
                            borderWidth: 3,
                            hoverOffset: 12,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                    },
                    plugins: {
                        legend: { position: "bottom" },
                    },
                },
            });
        }

        statusChartInstance?.destroy();
        if (refs.statusChartCanvas) {
            const statusTotals = entries.reduce(
                (acc, entry) => {
                    acc[entry.status] = (acc[entry.status] || 0) + entry.amount;
                    return acc;
                },
                { pending: 0, paid: 0 }
            );
            statusChartInstance = new Chart(refs.statusChartCanvas.getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Paid", "Pending"],
                    datasets: [
                        {
                            data: [statusTotals.paid || 0, statusTotals.pending || 0],
                            backgroundColor: ["rgba(16, 185, 129, 0.6)", "rgba(245, 158, 11, 0.6)"],
                            borderColor: ["#10B981", "#F59E0B"],
                            borderWidth: 2,
                            borderRadius: 8,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        delay: (context) => context.dataIndex * 120,
                    },
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: "rgba(15, 23, 42, 0.06)" },
                        },
                        x: {
                            grid: { display: false },
                        },
                    },
                },
            });
        }
    };

    const renderResults = () => {
        if (!refs.shareAmount || !refs.breakdownList) return;
        const result = getSplitResults();
        if (!result.entries.length) {
            refs.shareAmount.textContent = formatCurrency(0);
            refs.peopleLabel.textContent = "0";
            refs.totalLabel.textContent = formatCurrency(0);
            refs.breakdownList.innerHTML = "";
            refs.remainder.hidden = true;
            chartInstance?.destroy();
            statusChartInstance?.destroy();
            return;
        }

        refs.shareAmount.textContent = formatCurrency(result.share);
        refs.peopleLabel.textContent = result.people.toString();
        refs.totalLabel.textContent = formatCurrency(result.total);

        refs.breakdownList.innerHTML = result.entries
            .map(
                (entry) => `
            <li>
                <div>
                    <strong>${entry.name}</strong>
                    <p class="helper-text">${entry.status === "paid" ? "Already paid" : "Needs to pay"}</p>
                </div>
                <div>
                    <span class="status-chip ${entry.status}">${entry.status.toUpperCase()}</span>
                    <strong>${formatCurrency(entry.amount)}</strong>
                </div>
            </li>`
            )
            .join("");

        if (result.remainder !== 0) {
            refs.remainder.hidden = false;
            refs.remainder.textContent = `Precision tweak: last entry adjusted by ${formatCurrency(result.remainder)} so the total stays exact.`;
        } else {
            refs.remainder.hidden = true;
        }

        renderCharts(result.entries);
    };

    const buildShareSummary = () => {
        const result = getSplitResults();
        if (!result.entries.length) return null;
        const breakdown = result.entries.map((entry) => `${entry.name}: ${formatCurrency(entry.amount)} (${entry.status})`).join("; ");
        return `Split summary — total ${formatCurrency(result.total)} across ${result.people} people. ${breakdown}.`;
    };

    const shareSummary = (mode) => {
        const summary = buildShareSummary();
        if (!summary) {
            App.showToast("Calculate a split first");
            return;
        }
        const encoded = encodeURIComponent(summary);
        if (mode === "whatsapp") {
            window.open(`https://wa.me/?text=${encoded}`, "_blank");
        } else if (mode === "telegram") {
            window.open(`https://t.me/share/url?text=${encoded}`, "_blank");
        } else if (mode === "instagram") {
            App.showToast("Instagram sharing works via native share sheet");
        } else if (mode === "email") {
            window.open(`mailto:?subject=EduFinance split&body=${encoded}`, "_blank");
        } else if (mode === "sms") {
            window.location.href = `sms:?&body=${encoded}`;
        } else {
            navigator.clipboard
                ?.writeText(summary)
                .then(() => App.showToast("Summary copied"))
                .catch(() => App.showToast(summary));
        }
        toggleShareMenu(false);
    };

    const toggleShareMenu = (force) => {
        if (!refs.shareMenu || !refs.shareButton) return;
        const willShow = typeof force === "boolean" ? force : refs.shareMenu.hidden;
        refs.shareMenu.hidden = !willShow;
        refs.shareButton.setAttribute("aria-expanded", String(willShow));
    };

    refs.form?.addEventListener("submit", (event) => {
        event.preventDefault();
        renderResults();
        refs.form.classList.add("is-active");
        setTimeout(() => refs.form.classList.remove("is-active"), 400);
    });

    refs.amount?.addEventListener("input", renderResults);
    refs.peopleInput?.addEventListener("input", () => {
        const count = Math.min(25, Math.max(1, Number(refs.peopleInput.value) || 1));
        syncParticipantCount(count);
    });
    refs.shareButton?.addEventListener("click", () => toggleShareMenu());
    refs.shareMenu?.addEventListener("click", (event) => {
        const action = event.target.closest("[data-share]")?.dataset.share;
        if (!action) return;
        shareSummary(action);
    });
    document.addEventListener("click", (event) => {
        if (!refs.shareMenu || refs.shareMenu.hidden) return;
        if (event.target.closest(".share-control")) return;
        toggleShareMenu(false);
    });

    const markActiveButton = (buttonGroup, activeButton) => {
        buttonGroup.forEach((button) => button.classList.toggle("is-active", button === activeButton));
    };

    quickAmountButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const value = Number(button.dataset.quickAmount);
            if (!value) return;
            refs.amount.value = value;
            renderResults();
            markActiveButton(quickAmountButtons, button);
        });
    });

    quickPeopleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const count = Number(button.dataset.quickPeople);
            if (!count) return;
            refs.peopleInput.value = count;
            syncParticipantCount(count);
            markActiveButton(quickPeopleButtons, button);
        });
    });

    syncParticipantCount(Number(refs.peopleInput.value || 1));
    renderResults();
});

>>>>>>> eb4b0ab6b3af2982f8a1e8049d5578c2995278fe

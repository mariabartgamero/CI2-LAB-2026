let elapsedInterval = null;
let startEligibilityTimer = null;

export function renderActiveReservationCard(container, reservation, options = {}) {
    clearElapsedTimer();
    clearStartEligibilityTimer();
    if (!reservation) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    const status = reservationStatus(reservation);
    const isInProgress = status === "EN_CURSO";
    const isPending = status === "PENDIENTE" || status === "ACTIVE";
    const currentUserId = Number(options.currentUser?.id);
    const isDriver = Number(reservation.usuarioCreadorId) === currentUserId;
    const currentOccupant = reservation.usuariosApuntados?.find((occupant) => Number(occupant.id) === currentUserId);
    const passengers = passengersFor(reservation);
    const currentPassengerReady = Boolean(currentOccupant?.ready);
    const canStart = isPending && isDriver && canStartReservation(reservation);
    const points = effectivePoints(reservation);

    container.classList.remove("hidden");
    container.innerHTML = `
        <div>
            <p class="eyebrow">${isInProgress ? "Trayecto en curso" : "Reserva activa"}</p>
            <strong>${reservation.matricula} · Mercedes EQA Electrico</strong>
            <span>${tripTypeLabel(reservation.tipoTrayecto)} · ${destinationName(reservation)}</span>
            <small>${reservation.plazasOcupadas}/5 ocupantes · ${points} puntos · ${statusLabel(status)}</small>
            ${points === 0 ? "<small>Necesitas al menos 2 ocupantes para ganar puntos.</small>" : ""}
            ${passengers.length ? `<small>${passengers.map(passengerReadyLabel).join(" · ")}</small>` : ""}
            ${isInProgress ? `<strong class="active-trip-timer" data-active-elapsed="${reservation.horaSalida}">${elapsedTimeLabel(reservation.horaSalida)}</strong>` : ""}
        </div>
        ${isPending ? `
            <div class="active-reservation-actions">
                ${isDriver ? `<button class="button primary trip-action" data-start-active-reservation="${reservation.id}" type="button" ${canStart ? "" : "disabled"}>Iniciar viaje</button>` : ""}
                ${!isDriver ? `<button class="button success" data-ready-active-reservation="${reservation.id}" type="button" ${currentPassengerReady ? "disabled" : ""}>${currentPassengerReady ? "Listo" : "Estoy listo"}</button>` : ""}
                <button class="button danger" data-cancel-active-reservation="${reservation.id}" type="button">Cancelar viaje</button>
            </div>
        ` : ""}
        ${isInProgress && isDriver ? `
            <div class="active-reservation-actions">
                <button class="button primary trip-action" data-finish-active-reservation="${reservation.id}" type="button">Finalizar trayecto</button>
            </div>
        ` : ""}
    `;

    bindActiveReservationActions(container, options);
    startElapsedTimer(container);
    scheduleStartEligibilityUpdate(container, reservation);
}

function formatTime(value) {
    return new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

function reservationStatus(reservation) {
    return reservation.estadoUsuario ?? reservation.estado;
}

function tripTypeLabel(value) {
    return value === "VUELTA" ? "Vuelta" : "Ida";
}

function destinationName(reservation) {
    return reservation.destinoNombre ?? reservation.destino?.nombre ?? "Destino";
}

function effectivePoints(reservation) {
    return Number(reservation.plazasOcupadas) >= 2 ? reservation.puntosPrevistos : 0;
}

function passengersFor(reservation) {
    return (reservation.usuariosApuntados ?? [])
        .filter((occupant) => Number(occupant.id) !== Number(reservation.usuarioCreadorId));
}

function passengerReadyLabel(passenger) {
    return `${passenger.nombre}${passenger.ready ? " listo" : " pendiente"}`;
}

function canStartReservation(reservation) {
    const startTime = new Date(reservation.horaSalida).getTime();
    if (!startTime) return false;
    if (Date.now() >= startTime) return true;

    const passengers = passengersFor(reservation);
    return passengers.length === 0 || passengers.every((passenger) => passenger.ready);
}

function bindActiveReservationActions(container, options) {
    container.querySelector("[data-start-active-reservation]")?.addEventListener("click", async (event) => {
        await runButtonAction(event.currentTarget, () => (
            options.onStart?.(Number(event.currentTarget.dataset.startActiveReservation))
        ));
    });

    container.querySelector("[data-ready-active-reservation]")?.addEventListener("click", async (event) => {
        await runButtonAction(event.currentTarget, () => (
            options.onReady?.(Number(event.currentTarget.dataset.readyActiveReservation))
        ));
    });

    container.querySelector("[data-cancel-active-reservation]")?.addEventListener("click", async (event) => {
        await runButtonAction(event.currentTarget, () => (
            options.onCancel?.(Number(event.currentTarget.dataset.cancelActiveReservation))
        ));
    });

    container.querySelector("[data-finish-active-reservation]")?.addEventListener("click", async (event) => {
        await runButtonAction(event.currentTarget, () => (
            options.onFinish?.(Number(event.currentTarget.dataset.finishActiveReservation))
        ));
    });
}

async function runButtonAction(button, action) {
    const defaultText = button.textContent;
    button.disabled = true;
    button.textContent = "Cargando...";
    try {
        await action?.();
    } finally {
        button.disabled = false;
        button.textContent = defaultText;
    }
}

function statusLabel(status) {
    const labels = {
        PENDIENTE: "pendiente",
        ACTIVE: "pendiente",
        EN_CURSO: "en curso",
        FINALIZADA: "finalizada",
        COMPLETED: "finalizada",
        CANCELADA: "cancelada",
        CANCELLED: "cancelada",
        EXPIRED: "caducada",
        CADUCADA: "caducada"
    };
    return labels[status] ?? String(status).toLowerCase();
}

function startElapsedTimer(container) {
    updateElapsedTimer(container);
    if (!container.querySelector("[data-active-elapsed]")) return;
    elapsedInterval = setInterval(() => updateElapsedTimer(container), 1000);
}

function updateElapsedTimer(container) {
    container.querySelectorAll("[data-active-elapsed]").forEach((node) => {
        node.textContent = elapsedTimeLabel(node.dataset.activeElapsed);
    });
}

function elapsedTimeLabel(startValue) {
    const elapsedMs = Math.max(0, Date.now() - new Date(startValue).getTime());
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    if (hours > 0) return `Duracion del viaje: ${hours}:${minutes}:${seconds}`;
    return `Duracion del viaje: ${minutes}:${seconds}`;
}

function clearElapsedTimer() {
    if (!elapsedInterval) return;
    clearInterval(elapsedInterval);
    elapsedInterval = null;
}

function scheduleStartEligibilityUpdate(container, reservation) {
    const startButton = container.querySelector("[data-start-active-reservation]");
    if (!startButton || canStartReservation(reservation)) return;

    const delay = new Date(reservation.horaSalida).getTime() - Date.now();
    if (delay <= 0) {
        startButton.disabled = false;
        return;
    }

    startEligibilityTimer = setTimeout(() => {
        startButton.disabled = false;
    }, delay);
}

function clearStartEligibilityTimer() {
    if (!startEligibilityTimer) return;
    clearTimeout(startEligibilityTimer);
    startEligibilityTimer = null;
}

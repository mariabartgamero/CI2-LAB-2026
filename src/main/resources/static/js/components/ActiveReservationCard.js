let countdownInterval = null;

export function renderActiveReservationCard(container, reservation) {
    clearCountdown();
    if (!reservation) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    const status = reservationStatus(reservation);
    const isInProgress = status === "EN_CURSO";

    container.classList.remove("hidden");
    container.innerHTML = `
        <div>
            <p class="eyebrow">${isInProgress ? "Trayecto en curso" : "Reserva activa"}</p>
            <strong>${reservation.matricula} · Mercedes EQA Electrico</strong>
            <span>${reservation.destino?.nombre ?? "Oficina destino"}</span>
            <small>${reservation.plazasOcupadas}/5 ocupantes · Llegada ${formatTime(reservation.horaEstimadaLlegada)} · ${reservation.puntosPrevistos} puntos · ${statusLabel(status)}</small>
            ${isInProgress ? `<strong class="active-countdown" data-active-countdown="${reservation.horaEstimadaLlegada}">${remainingTimeLabel(reservation.horaEstimadaLlegada)}</strong>` : ""}
        </div>
    `;

    startCountdown(container);
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

function statusLabel(status) {
    const labels = {
        PENDIENTE: "pendiente",
        ACTIVE: "pendiente",
        EN_CURSO: "en curso",
        FINALIZADA: "finalizada",
        COMPLETED: "finalizada",
        CANCELADA: "cancelada",
        CANCELLED: "cancelada"
    };
    return labels[status] ?? String(status).toLowerCase();
}

function startCountdown(container) {
    updateCountdown(container);
    if (!container.querySelector("[data-active-countdown]")) return;
    countdownInterval = setInterval(() => updateCountdown(container), 1000);
}

function updateCountdown(container) {
    container.querySelectorAll("[data-active-countdown]").forEach((node) => {
        node.textContent = remainingTimeLabel(node.dataset.activeCountdown);
    });
}

function remainingTimeLabel(arrivalValue) {
    const remainingMs = new Date(arrivalValue).getTime() - Date.now();
    if (remainingMs <= 0) return "Tiempo restante: 00:00";

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `Tiempo restante: ${minutes}:${seconds}`;
}

function clearCountdown() {
    if (!countdownInterval) return;
    clearInterval(countdownInterval);
    countdownInterval = null;
}

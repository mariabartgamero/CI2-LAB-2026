export function renderActiveReservationCard(container, reservation) {
    if (!reservation) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML = `
        <div>
            <p class="eyebrow">Reserva activa</p>
            <strong>${reservation.matricula} · Mercedes EQA Electrico</strong>
            <span>${reservation.destino?.nombre ?? "Oficina destino"}</span>
            <small>${reservation.plazasOcupadas}/5 ocupantes · Llegada ${formatTime(reservation.horaEstimadaLlegada)} · ${reservation.puntosPrevistos} puntos</small>
        </div>
    `;
}

function formatTime(value) {
    return new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

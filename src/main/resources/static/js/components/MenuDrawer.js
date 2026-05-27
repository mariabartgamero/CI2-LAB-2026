import { formatDateTime } from "../utils/dateTime.js";

export function renderMenuDrawer(container, { user, reservations }, onStart, onCancel, onLogout, onClose) {
    const completed = reservations.filter((reservation) => isCompleted(reservationStatusForUser(reservation)));
    const cancelled = reservations.filter((reservation) => isCancelled(reservationStatusForUser(reservation)));
    const expired = reservations.filter((reservation) => isExpired(reservationStatusForUser(reservation)));

    container.classList.remove("hidden");
    container.innerHTML = `
        <div class="drawer-backdrop"></div>
        <aside class="drawer-panel">
            <div class="drawer-head">
                <div>
                    <p class="eyebrow">Menu</p>
                    <h2>${user.nombre}</h2>
                </div>
                <button class="sheet-close drawer-close" type="button" aria-label="Cerrar">×</button>
            </div>

            <section class="drawer-section">
                <h3>Perfil y puntos</h3>
                <div class="profile-summary">
                    <strong>${user.empresaNombre}</strong>
                    <span>${user.puntosResponsables} puntos acumulados</span>
                    <p>Tus puntos se calculan segun la distancia del coche a la oficina.</p>
                </div>
            </section>

            <section class="drawer-section">
                <h3>Reservas</h3>
                <h4>Completadas</h4>
                ${completed.length ? completed.map((reservation) => reservationCard(reservation, user)).join("") : "<p class='empty-copy'>Sin reservas completadas.</p>"}
                <h4>Canceladas</h4>
                ${cancelled.length ? cancelled.map((reservation) => reservationCard(reservation, user)).join("") : "<p class='empty-copy'>Sin reservas canceladas.</p>"}
                <h4>Caducadas</h4>
                ${expired.length ? expired.map((reservation) => reservationCard(reservation, user)).join("") : "<p class='empty-copy'>Sin reservas caducadas.</p>"}
            </section>

            <button class="button secondary logout-action" type="button">Cerrar sesion</button>
        </aside>
    `;

    container.querySelector(".drawer-backdrop").addEventListener("click", onClose);
    container.querySelector(".drawer-close").addEventListener("click", onClose);
    container.querySelector(".logout-action").addEventListener("click", onLogout);
}

export function closeMenuDrawer(container) {
    container.classList.add("hidden");
    container.innerHTML = "";
}

function reservationCard(reservation, user) {
    const status = reservationStatusForUser(reservation);
    const points = effectivePoints(reservation);
    return `
        <article class="drawer-reservation">
            <div class="drawer-reservation-head">
                <strong>${reservation.matricula} · Mercedes EQA Electrico</strong>
                <span class="reservation-status">${statusLabel(status)}</span>
            </div>
            <span>${tripTypeLabel(reservation.tipoTrayecto)} · ${destinationName(reservation)}</span>
            <span>${formatDateTime(reservation.horaSalida)}</span>
            <span>Coche: ${reservation.matricula}</span>
            <span>Rol: ${reservationRole(reservation, user)}</span>
            <span>${reservation.plazasOcupadas}/5 ocupantes · ${points} puntos</span>
            ${points === 0 ? "<span>Necesitas al menos 2 ocupantes para ganar puntos.</span>" : ""}
        </article>
    `;
}

function reservationStatusForUser(reservation) {
    if (isExpired(reservation.estado)) return reservation.estado;
    return reservation.estadoUsuario ?? reservation.estado;
}

function isCompleted(status) {
    return status === "FINALIZADA" || status === "COMPLETED";
}

function isCancelled(status) {
    return status === "CANCELADA" || status === "CANCELLED";
}

function isExpired(status) {
    return status === "EXPIRED" || status === "CADUCADA";
}

function reservationRole(reservation, user) {
    return Number(reservation.usuarioCreadorId) === Number(user.id) ? "creador" : "acompanante";
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

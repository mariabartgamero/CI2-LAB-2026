import { formatDateTime } from "../utils/dateTime.js";

export function renderMenuDrawer(container, { user, reservations }, onStart, onCancel, onLogout, onClose) {
    const completed = reservations.filter((reservation) => isCompleted(reservationStatusForUser(reservation)));
    const cancelled = reservations.filter((reservation) => isCancelled(reservationStatusForUser(reservation)));

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
                ${completed.length ? completed.map((reservation) => reservationCard(reservation)).join("") : "<p class='empty-copy'>Sin reservas completadas.</p>"}
                <h4>Canceladas</h4>
                ${cancelled.length ? cancelled.map((reservation) => reservationCard(reservation)).join("") : "<p class='empty-copy'>Sin reservas canceladas.</p>"}
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

function reservationCard(reservation) {
    return `
        <article class="drawer-reservation">
            <strong>${reservation.matricula} · Mercedes EQA Electrico</strong>
            <span>${formatDateTime(reservation.horaSalida)}</span>
            <span>Llegada estimada: ${formatDateTime(reservation.horaEstimadaLlegada)}</span>
            <span>Estado: ${statusLabel(reservationStatusForUser(reservation))}</span>
            <span>${reservation.plazasOcupadas}/5 ocupantes · ${reservation.puntosPrevistos} puntos</span>
        </article>
    `;
}

function reservationStatusForUser(reservation) {
    return reservation.estadoUsuario ?? reservation.estado;
}

function isCompleted(status) {
    return status === "FINALIZADA" || status === "COMPLETED";
}

function isCancelled(status) {
    return status === "CANCELADA" || status === "CANCELLED";
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

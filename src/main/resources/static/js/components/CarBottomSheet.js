import { tripMetrics } from "../utils/location.js";
import { defaultStartTimeValue, estimatedArrivalLabel, localDateTimePayload, validateStartTime } from "../utils/dateTime.js";
import { API_BASE_URL } from "../services/api.js";

const CAR_BRAND = "MERCEDES EQA";
const CAR_MODEL = "Mercedes-Benz EQA Electrico";
const CAR_IMAGE_URL = `${API_BASE_URL}/imagenes/coche.png`;

export function renderCarBottomSheet(container, car, activeReservation, offices, currentUser, onAction, onClose) {
    if (!car) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    const selectedOffice = resolveInitialOffice(car, offices);
    const metrics = tripMetrics(car, selectedOffice);
    const isAvailable = car.estado === "LIBRE";
    const hasReservation = Boolean(car.reserva);
    const reservationStatus = hasReservation ? car.reserva.estado : null;
    const isBookableReservation = reservationStatus === "PENDIENTE" || reservationStatus === "ACTIVE";
    const occupants = hasReservation ? car.reserva.usuariosApuntados ?? [] : [];
    const isSelectedCarMyActiveTrip = activeReservation && sameId(activeReservation.cocheId, car.id);
    const isAlreadyOccupant = occupants.some((occupant) => sameId(occupant.id, currentUser.id)) || isSelectedCarMyActiveTrip;
    const canJoin = hasReservation && isBookableReservation && car.plazasDisponibles > 0 && !isAlreadyOccupant && !activeReservation;
    const canCancel = isAlreadyOccupant && isBookableReservation;
    const hasOtherActiveReservation = activeReservation && !isSelectedCarMyActiveTrip;
    const defaultStart = defaultStartTimeValue();
    const arrival = estimatedArrivalLabel(defaultStart, metrics.minutes);
    container.classList.remove("hidden");
    container.innerHTML = `
        <button class="sheet-close" type="button" aria-label="Cerrar">×</button>
        <div class="sheet-handle"></div>
        <div class="car-main">
            <div class="car-copy">
                <p class="eyebrow">${CAR_BRAND}</p>
                <h2>${car.matricula}</h2>
                <p class="model">${CAR_MODEL}</p>
            </div>
            <div class="car-photo-wrap">
                <img class="car-photo" src="${CAR_IMAGE_URL}" alt="${CAR_MODEL}">
            </div>
        </div>
        <div class="car-stats">
            <span>${car.bateria}%</span>
            <span>${metrics.autonomyKm} km</span>
            <span>${hasReservation ? `${car.plazasDisponibles} plazas libres` : "Electrico corporativo"}</span>
        </div>
        ${hasReservation ? `
            <div class="occupants">
                <span>Ocupantes</span>
                <strong>${occupants.length}/5</strong>
                <p>${occupants.map(occupantName).join(", ")}</p>
            </div>
        ` : ""}
            <div class="trip-card">
            <span>Destino</span>
            <strong id="destinationName">${metrics.destination.name}</strong>
            <p>${metrics.distanceLabel} · ${metrics.minutes} min aprox.</p>
        </div>
        <div class="points-row">
            <span>Ganaras</span>
            <strong>${metrics.points} puntos</strong>
        </div>
        <p class="sheet-note">Cuanto mas lejos de la empresa, mas puntos.</p>
        ${activeReservation ? `
            <div class="active-inline">
                <span>Ya tienes una reserva activa</span>
                <strong>${activeReservation.matricula}</strong>
                <p>Inicio: ${formatTime(activeReservation.horaSalida)} · Llegada: ${formatTime(activeReservation.horaEstimadaLlegada)}</p>
            </div>
        ` : ""}
        ${isAvailable && !activeReservation ? `
            <label class="time-field">
                Oficina destino
                <select id="officeSelect">
                    ${offices.map((office) => `<option value="${office.id}" ${office.id === selectedOffice.id ? "selected" : ""}>${office.nombre}</option>`).join("")}
                </select>
            </label>
            <label class="time-field">
                Hora de inicio
                <input id="startTimeInput" type="datetime-local" value="${defaultStart}" required>
            </label>
            <p class="arrival-copy" id="arrivalCopy">Llegada automatica a ${metrics.destination.name} · ${arrival} · ${metrics.minutes} min aprox.</p>
            <p class="sheet-note">Reserva con 12 h o menos · Max. 1 reserva por persona al dia.</p>
            <p class="message error hidden" id="sheetError"></p>
        ` : ""}
        ${canCancel ? `<button class="button danger cancel-trip-action" type="button">Cancelar viaje</button>` : ""}
        ${!isAlreadyOccupant && canJoin ? `<button class="button primary join-action" type="button">Unirme al viaje</button>` : ""}
        ${!isAlreadyOccupant && isAvailable && !activeReservation ? `<button class="button primary reserve-action" type="button">Reservar</button>` : ""}
        ${!isAlreadyOccupant && hasOtherActiveReservation ? `<button class="button primary" type="button" disabled>Ya tienes una reserva activa</button>` : ""}
        ${!isAlreadyOccupant && !isAvailable && !canJoin && !hasOtherActiveReservation ? `<button class="button primary" type="button" disabled>No disponible</button>` : ""}
    `;

    container.querySelector(".sheet-close").addEventListener("click", onClose);
    const startTimeInput = container.querySelector("#startTimeInput");
    const officeSelect = container.querySelector("#officeSelect");
    const refreshArrival = () => {
        const liveMetrics = tripMetrics(car, findOffice(offices, Number(officeSelect?.value)) || selectedOffice);
        const arrivalText = estimatedArrivalLabel(startTimeInput.value, liveMetrics.minutes);
        container.querySelector("#destinationName").textContent = liveMetrics.destination.name;
        container.querySelector("#arrivalCopy").textContent = `Llegada automatica a ${liveMetrics.destination.name} · ${arrivalText} · ${liveMetrics.minutes} min aprox.`;
        container.querySelector(".trip-card p").textContent = `${liveMetrics.distanceLabel} · ${liveMetrics.minutes} min aprox.`;
        container.querySelector(".points-row strong").textContent = `${liveMetrics.points} puntos`;
    };
    startTimeInput?.addEventListener("input", refreshArrival);
    officeSelect?.addEventListener("change", refreshArrival);
    container.querySelector(".reserve-action")?.addEventListener("click", () => {
        if (!isAvailable || activeReservation) return;
        const error = validateStartTime(startTimeInput.value);
        if (error) {
            const errorNode = container.querySelector("#sheetError");
            errorNode.textContent = error;
            errorNode.classList.remove("hidden");
            return;
        }
        const selectedDestination = findOffice(offices, Number(officeSelect.value)) || selectedOffice;
        const liveMetrics = tripMetrics(car, selectedDestination);
        onAction(car, {
            ...liveMetrics,
            officeId: selectedDestination.id,
            startTime: localDateTimePayload(startTimeInput.value)
        });
    });
    container.querySelector(".join-action")?.addEventListener("click", () => {
        onAction(car, metrics, "join");
    });
    container.querySelector(".cancel-trip-action")?.addEventListener("click", () => {
        onAction(car, metrics, "cancel");
    });
}

function resolveInitialOffice(car, offices) {
    if (car.reserva?.destino) return car.reserva.destino;
    return offices[0];
}

function findOffice(offices, officeId) {
    return offices.find((office) => office.id === officeId);
}

function occupantName(occupant) {
    return typeof occupant === "string" ? occupant : occupant.nombre;
}

function sameId(left, right) {
    return Number(left) === Number(right);
}

function formatTime(value) {
    return new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

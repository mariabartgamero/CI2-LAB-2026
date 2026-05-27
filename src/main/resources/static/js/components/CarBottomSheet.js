import { geocodeAddress, tripMetrics } from "../utils/location.js";
import { defaultStartTimeValue, localDateTimePayload, validateStartTime } from "../utils/dateTime.js";
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
    const isAvailable = car.estado === "LIBRE";
    const hasReservation = Boolean(car.reserva);
    const metrics = tripMetrics(car, hasReservation ? destinationFromReservation(car.reserva) : selectedOffice);
    const reservationStatus = hasReservation ? car.reserva.estado : null;
    const isBookableReservation = reservationStatus === "PENDIENTE" || reservationStatus === "ACTIVE";
    const occupants = hasReservation ? car.reserva.usuariosApuntados ?? [] : [];
    const isSelectedCarMyActiveTrip = activeReservation && sameId(activeReservation.cocheId, car.id);
    const isAlreadyOccupant = occupants.some((occupant) => sameId(occupant.id, currentUser.id)) || isSelectedCarMyActiveTrip;
    const canJoin = hasReservation && isBookableReservation && car.plazasDisponibles > 0 && !isAlreadyOccupant && !activeReservation;
    const canCancel = isAlreadyOccupant && isBookableReservation;
    const hasOtherActiveReservation = activeReservation && !isSelectedCarMyActiveTrip;
    const defaultStart = defaultStartTimeValue();
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
            <p>${hasReservation ? `Reserva: ${formatDateTime(car.reserva.horaSalida)} · ` : ""}${metrics.distanceLabel} · ${metrics.minutes} min aprox.</p>
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
            </div>
        ` : ""}
        ${isAvailable && !activeReservation ? `
            <label class="time-field">
                Tipo de trayecto
                <select id="tripTypeSelect">
                    <option value="IDA" selected>Ida a oficina</option>
                    <option value="VUELTA">Vuelta a direccion</option>
                </select>
            </label>
            <label class="time-field ida-field">
                Oficina destino
                <select id="officeSelect">
                    ${offices.map((office) => `<option value="${office.id}" ${office.id === selectedOffice.id ? "selected" : ""}>${office.nombre}</option>`).join("")}
                </select>
            </label>
            <label class="time-field return-field hidden">
                Direccion destino
                <input id="returnAddressInput" type="text" placeholder="Calle, numero, ciudad">
            </label>
            <label class="time-field">
                Hora de inicio
                <input id="startTimeInput" type="datetime-local" value="${defaultStart}" required>
            </label>
            <p class="sheet-note">Reserva con 12 h o menos · Max. 1 ida y 1 vuelta por dia.</p>
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
    const tripTypeSelect = container.querySelector("#tripTypeSelect");
    const officeSelect = container.querySelector("#officeSelect");
    const returnAddressInput = container.querySelector("#returnAddressInput");
    const refreshArrival = () => {
        const tipoTrayecto = tripTypeSelect?.value ?? "IDA";
        container.querySelector(".ida-field")?.classList.toggle("hidden", tipoTrayecto !== "IDA");
        container.querySelector(".return-field")?.classList.toggle("hidden", tipoTrayecto !== "VUELTA");
        clearSheetError(container);

        if (tipoTrayecto === "VUELTA") {
            const address = returnAddressInput.value.trim();
            container.querySelector("#destinationName").textContent = address || "Direccion destino";
            container.querySelector(".trip-card p").textContent = address ? "Se calculara al reservar" : "Escribe una direccion";
            container.querySelector(".points-row strong").textContent = "Pendiente";
            return;
        }

        const liveMetrics = idaTripMetrics(car, offices, selectedOffice, officeSelect);
        container.querySelector("#destinationName").textContent = liveMetrics.destination.name;
        container.querySelector(".trip-card p").textContent = `${liveMetrics.distanceLabel} · ${liveMetrics.minutes} min aprox.`;
        container.querySelector(".points-row strong").textContent = `${liveMetrics.points} puntos`;
    };
    startTimeInput?.addEventListener("input", refreshArrival);
    tripTypeSelect?.addEventListener("change", refreshArrival);
    officeSelect?.addEventListener("change", refreshArrival);
    returnAddressInput?.addEventListener("input", refreshArrival);
    container.querySelector(".reserve-action")?.addEventListener("click", async (event) => {
        if (!isAvailable || activeReservation) return;
        const error = validateStartTime(startTimeInput.value);
        if (error) {
            showSheetError(container, error);
            return;
        }
        await runButtonAction(event.currentTarget, "Reservando...", async () => {
            const liveMetrics = await currentTripMetrics(car, offices, selectedOffice, tripTypeSelect, officeSelect, returnAddressInput);
            if (liveMetrics?.error) {
                showSheetError(container, liveMetrics.error);
                return;
            }
            if (!liveMetrics) {
                showSheetError(container, "No se encontró esa dirección");
                return;
            }
            await onAction(car, {
                ...liveMetrics,
                startTime: localDateTimePayload(startTimeInput.value)
            });
        });
    });
    container.querySelector(".join-action")?.addEventListener("click", async (event) => {
        await runButtonAction(event.currentTarget, "Uniendo...", () => onAction(car, metrics, "join"));
    });
    container.querySelector(".cancel-trip-action")?.addEventListener("click", async (event) => {
        await runButtonAction(event.currentTarget, "Cancelando...", () => onAction(car, metrics, "cancel"));
    });
}

async function runButtonAction(button, loadingText, action) {
    const defaultText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
    await action?.();
    button.disabled = false;
    button.textContent = defaultText;
}

function resolveInitialOffice(car, offices) {
    if (car.reserva?.destino) return car.reserva.destino;
    return offices[0];
}

async function currentTripMetrics(car, offices, selectedOffice, tripTypeSelect, officeSelect, returnAddressInput) {
    const tipoTrayecto = tripTypeSelect?.value ?? "IDA";
    if (tipoTrayecto === "VUELTA") {
        const address = returnAddressInput?.value.trim();
        if (!address) return { error: "No se encontró esa dirección" };

        const destination = await geocodeAddress(address);
        if (destination.error) return destination;

        return {
            ...tripMetrics(car, destination),
            tipoTrayecto,
            officeId: null,
            destinoNombre: destination.name,
            destinoDireccion: destination.address,
            destinoLatitud: destination.lat,
            destinoLongitud: destination.lng
        };
    }

    return idaTripMetrics(car, offices, selectedOffice, officeSelect);
}

function idaTripMetrics(car, offices, selectedOffice, officeSelect) {
    const selectedDestination = findOffice(offices, Number(officeSelect?.value)) || selectedOffice;
    return {
        ...tripMetrics(car, selectedDestination),
        tipoTrayecto: "IDA",
        officeId: selectedDestination.id,
        destinoNombre: selectedDestination.nombre,
        destinoDireccion: selectedDestination.direccion,
        destinoLatitud: selectedDestination.latitud,
        destinoLongitud: selectedDestination.longitud
    };
}

function destinationFromReservation(reservation) {
    if (reservation?.destinoLatitud != null && reservation?.destinoLongitud != null) {
        return {
            lat: reservation.destinoLatitud,
            lng: reservation.destinoLongitud,
            name: reservation.destinoNombre ?? reservation.destino?.nombre ?? "Destino"
        };
    }
    return reservation?.destino;
}

function findOffice(offices, officeId) {
    return offices.find((office) => office.id === officeId);
}

function showSheetError(container, message) {
    const errorNode = container.querySelector("#sheetError");
    errorNode.textContent = message;
    errorNode.classList.remove("hidden");
}

function clearSheetError(container) {
    const errorNode = container.querySelector("#sheetError");
    if (!errorNode) return;
    errorNode.textContent = "";
    errorNode.classList.add("hidden");
}

function occupantName(occupant) {
    return typeof occupant === "string" ? occupant : occupant.nombre;
}

function sameId(left, right) {
    return Number(left) === Number(right);
}

function formatDateTime(value) {
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

import { renderActiveReservationCard } from "../components/ActiveReservationCard.js";
import { renderCarBottomSheet } from "../components/CarBottomSheet.js";
import { closeMenuDrawer, renderMenuDrawer } from "../components/MenuDrawer.js";
import { getVisibleCars } from "../services/carService.js";
import { getCompanyOffices } from "../services/officeService.js";
import { cancelReservation, finishReservation, getActiveReservation, getUserReservations, joinReservation, markReservationReady, rateReservation, reserveCar, startReservation } from "../services/reservationService.js";
import { getUser } from "../services/userService.js";

const screen = {
    user: null,
    logout: null,
    map: null,
    markers: [],
    officeMarkers: [],
    activeRouteLayer: null,
    activeRouteKey: "",
    activeRouteRequestId: 0,
    carMarkerRenderId: 0,
    roadPositionCache: new Map(),
    cars: [],
    offices: [],
    selectedCar: null,
    activeReservation: null,
    reservations: [],
    sessionId: 0,
    activeReservationPollTimer: null,
    refreshId: 0,
    officesCompanyId: null,
    carRenderKey: "",
    officeRenderKey: "",
    pendingRatingReservation: null,
    selectedRating: 0
};

export async function initMapScreen(user, logout) {
    const sessionId = ++screen.sessionId;
    clearMapScreen();
    screen.user = user;
    screen.logout = logout;
    renderUserPill();
    initMap();
    bindActions();
    try {
        await refresh(sessionId, { loadOffices: true });
    } catch (error) {
        if (sessionId !== screen.sessionId) return;
        showToast(error.message, "error");
        document.querySelector("#mapSummary").textContent = "No se pudieron cargar los coches";
    }
}

export function resetMapScreen() {
    screen.sessionId++;
    clearMapScreen();
    screen.user = null;
    screen.logout = null;
}

function initMap() {
    if (screen.map) {
        setTimeout(() => screen.map.invalidateSize(), 0);
        return;
    }

    screen.map = L.map("map", {
        zoomControl: false,
        preferCanvas: true
    }).setView([40.4168, -3.7038], 13);

    L.control.zoom({ position: "bottomright" }).addTo(screen.map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap &copy; CARTO"
    }).addTo(screen.map);

}

function bindActions() {
    document.querySelector("#locateBtn").onclick = fitMadrid;
    document.querySelector("#menuBtn").onclick = openMenu;
}

async function refresh(sessionId = screen.sessionId, options = {}) {
    const refreshId = ++screen.refreshId;
    const summary = document.querySelector("#mapSummary");
    if (!options.quiet && summary && screen.cars.length) summary.textContent = "Actualizando...";

    const shouldLoadOffices = options.loadOffices
        || screen.officesCompanyId !== screen.user.empresaId
        || !screen.offices.length;
    const shouldLoadReservations = Boolean(options.loadReservations || isMenuOpen());
    const shouldLoadUser = Boolean(options.loadUser);
    const [cars, activeReservation, reservations, offices, updatedUser] = await Promise.all([
        getVisibleCars(screen.user.id),
        getActiveReservation(screen.user.id),
        shouldLoadReservations ? getUserReservations(screen.user.id) : Promise.resolve(screen.reservations),
        shouldLoadOffices ? getCompanyOffices(screen.user.empresaId) : Promise.resolve(screen.offices),
        shouldLoadUser ? getUser(screen.user.id) : Promise.resolve(screen.user)
    ]);

    if (sessionId !== screen.sessionId || refreshId !== screen.refreshId) return;

    screen.cars = cars;
    screen.offices = offices;
    screen.officesCompanyId = screen.user.empresaId;
    screen.activeReservation = activeReservation;
    screen.reservations = reservations;
    screen.user = updatedUser;
    localStorage.setItem("activeUser", JSON.stringify(updatedUser));

    renderUserPill();
    renderOfficesIfChanged();
    await renderCarsIfChanged();
    renderActiveReservation(screen.activeReservation);
    await drawActiveRoute(screen.activeReservation);
    rerenderMenuIfOpen();
    scheduleActiveReservationPolling(screen.activeReservation);
    document.querySelector("#mapSummary").textContent = `${cars.length} coches cerca de ti`;
}

function refreshAfterAction({ loadUser = false } = {}) {
    return refresh(screen.sessionId, {
        quiet: true,
        loadReservations: isMenuOpen(),
        loadUser
    });
}

function refreshAfterActionInBackground(options = {}) {
    refreshAfterAction(options)
        .catch((error) => showToast(error.message, "error"));
}

function renderActiveReservation(reservation) {
    renderActiveReservationCard(
        document.querySelector("#activeReservation"),
        reservation,
        {
            currentUser: screen.user,
            onStart: handleStartReservation,
            onReady: handleReadyReservation,
            onCancel: handleCancelReservation,
            onFinish: handleFinishReservation
        }
    );
}

function clearMapScreen() {
    screen.markers.forEach((marker) => marker.remove());
    screen.officeMarkers.forEach((marker) => marker.remove());
    clearActiveRoute();
    screen.markers = [];
    screen.officeMarkers = [];
    screen.cars = [];
    screen.offices = [];
    screen.selectedCar = null;
    screen.activeReservation = null;
    screen.reservations = [];
    screen.refreshId++;
    screen.officesCompanyId = null;
    screen.carRenderKey = "";
    screen.officeRenderKey = "";
    screen.activeRouteKey = "";
    screen.carMarkerRenderId++;
    clearActiveReservationPolling();

    clearNode("#userPill");
    clearNode("#activeReservation", true);
    clearNode("#carBottomSheet", true);
    clearNode("#menuDrawer", true);
    clearNode("#ratingModal", true);
    clearNode("#toast", true);

    const summary = document.querySelector("#mapSummary");
    if (summary) summary.textContent = "Cargando coches...";
}

function clearNode(selector, hide = false) {
    const node = document.querySelector(selector);
    if (!node) return;
    node.innerHTML = "";
    if (hide) node.classList.add("hidden");
}

async function renderCarsIfChanged() {
    const nextKey = screen.cars.map(carKey).join("|");
    if (nextKey === screen.carRenderKey) return;
    screen.carRenderKey = nextKey;
    const renderId = ++screen.carMarkerRenderId;

    screen.markers.forEach((marker) => marker.remove());
    screen.markers = [];

    const markerPositions = await carMarkerPositions(screen.cars);
    if (renderId !== screen.carMarkerRenderId) return;

    screen.cars.forEach((car) => {
        const marker = L.marker(markerPositions.get(car.id) ?? [car.latitud, car.longitud], {
            zIndexOffset: 1000,
            icon: L.divIcon({
                className: "",
                html: `<button class="car-pin ${pinClass(car)}" type="button"></button>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            })
        });
        marker.on("click", () => selectCar(car));
        marker.addTo(screen.map);
        screen.markers.push(marker);
    });
}

function carKey(car) {
    const reservation = car.reserva;
    return [
        car.id,
        car.latitud,
        car.longitud,
        car.estado,
        car.plazasDisponibles,
        reservation?.id ?? "",
        reservation?.estado ?? "",
        reservation?.plazasOcupadas ?? "",
        reservation?.plazasDisponibles ?? ""
    ].join(":");
}

async function carMarkerPositions(cars) {
    const groups = new Map();
    cars.forEach((car) => {
        const key = coordinateKey(car.latitud, car.longitud);
        groups.set(key, [...(groups.get(key) ?? []), car]);
    });

    const positions = new Map();
    for (const [key, group] of groups) {
        const [lat, lng] = key.split(":").map(Number);
        const roadPositions = await nearbyRoadPositions(lat, lng, group.length);
        group.forEach((car, index) => {
            positions.set(car.id, roadPositions[index] ?? roadPositions[0] ?? [lat, lng]);
        });
    }
    return positions;
}

async function nearbyRoadPositions(lat, lng, count) {
    if (count <= 1) return [await nearestRoadPosition(lat, lng)];

    const candidates = nearbyCandidateCoordinates(lat, lng);
    const roadPositions = [];
    const seen = new Set();

    for (const candidate of candidates) {
        const point = await nearestRoadPosition(candidate[0], candidate[1]);
        const key = coordinateKey(point[0], point[1]);
        if (seen.has(key) || distanceMeters([lat, lng], point) > 110) continue;

        seen.add(key);
        roadPositions.push(point);
        if (roadPositions.length >= count) break;
    }

    if (roadPositions.length >= count) return roadPositions;
    return compactFallbackPositions(roadPositions[0] ?? [lat, lng], count);
}

function nearbyCandidateCoordinates(lat, lng) {
    const candidates = [[lat, lng]];
    const rings = [18, 32, 48, 66, 84];
    const bearings = [0, 35, 80, 130, 185, 235, 285, 325];

    rings.forEach((radius, ringIndex) => {
        bearings.forEach((bearing) => {
            candidates.push(offsetCoordinate(lat, lng, radius, bearing + ringIndex * 17));
        });
    });
    return candidates;
}

async function nearestRoadPosition(lat, lng) {
    const fallback = [lat, lng];
    const key = coordinateKey(lat, lng);
    if (screen.roadPositionCache.has(key)) return screen.roadPositionCache.get(key);

    try {
        const response = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`);
        if (!response.ok) throw new Error(`OSRM nearest request failed: ${response.status}`);

        const data = await response.json();
        const location = data.waypoints?.[0]?.location;
        if (!location) throw new Error("OSRM did not return nearest road");

        const point = [location[1], location[0]];
        screen.roadPositionCache.set(key, point);
        return point;
    } catch (error) {
        console.warn("No se pudo ajustar el coche a una calle cercana.", error);
        screen.roadPositionCache.set(key, fallback);
        return fallback;
    }
}

function compactFallbackPositions(basePosition, total) {
    return Array.from({ length: total }, (_, index) => displayFallbackPosition(basePosition, index, total));
}

function displayFallbackPosition(basePosition, index, total) {
    const [lat, lng] = basePosition.map(Number);
    if (total <= 1 || !Number.isFinite(lat) || !Number.isFinite(lng)) return [lat, lng];

    const row = Math.floor(index / 3);
    const col = index % 3;
    const eastMeters = (col - 1) * 9 + (row % 2) * 4;
    const northMeters = row * 8;
    return offsetCoordinate(lat, lng, Math.hypot(eastMeters, northMeters), bearingFromOffset(eastMeters, northMeters));
}

function offsetCoordinate(lat, lng, meters, bearingDegrees) {
    const bearing = (bearingDegrees * Math.PI) / 180;
    const latOffset = (Math.cos(bearing) * meters) / 111320;
    const lngOffset = (Math.sin(bearing) * meters) / (111320 * Math.cos((lat * Math.PI) / 180));
    return [lat + latOffset, lng + lngOffset];
}

function bearingFromOffset(eastMeters, northMeters) {
    return (Math.atan2(eastMeters, northMeters) * 180) / Math.PI;
}

function distanceMeters(first, second) {
    const latMeters = (first[0] - second[0]) * 111320;
    const avgLat = ((first[0] + second[0]) / 2) * Math.PI / 180;
    const lngMeters = (first[1] - second[1]) * 111320 * Math.cos(avgLat);
    return Math.hypot(latMeters, lngMeters);
}

function coordinateKey(lat, lng) {
    return `${Number(lat).toFixed(6)}:${Number(lng).toFixed(6)}`;
}

function selectCar(car) {
    screen.selectedCar = car;
    renderCarBottomSheet(
        document.querySelector("#carBottomSheet"),
        car,
        screen.activeReservation,
        screen.offices,
        screen.user,
        handleCarAction,
        clearSelectedCar
    );
}

function clearSelectedCar() {
    screen.selectedCar = null;
    renderCarBottomSheet(document.querySelector("#carBottomSheet"), null);
}

async function getDrivingRoute(originLat, originLng, destLat, destLng) {
    const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
        throw new Error(`OSRM route request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes?.length) {
        throw new Error("OSRM did not return routes");
    }

    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

async function drawActiveRoute(reservation) {
    if (!reservation || !shouldShowActiveRoute(reservation)) {
        clearActiveRoute();
        return;
    }

    const points = routeCoordinates(reservation);
    const routeKey = activeRouteKey(reservation, points);
    if (!routeKey) {
        clearActiveRoute();
        return;
    }
    if (routeKey === screen.activeRouteKey && screen.activeRouteLayer) return;

    clearActiveRoute({ cancelPending: false });
    const routeRequestId = ++screen.activeRouteRequestId;

    try {
        const routePoints = await getDrivingRoute(...points);
        if (routeRequestId !== screen.activeRouteRequestId) return;
        screen.activeRouteLayer = L.polyline(routePoints, { weight: 5, opacity: 0.85 }).addTo(screen.map);
    } catch (error) {
        if (routeRequestId !== screen.activeRouteRequestId) return;
        console.warn("No se pudo cargar la ruta OSRM; pintando ruta aproximada.", error);
        screen.activeRouteLayer = L.polyline([
            [points[0], points[1]],
            [points[2], points[3]]
        ], {
            weight: 5,
            opacity: 0.85,
            dashArray: "8 10"
        }).addTo(screen.map);
    }

    screen.activeRouteKey = routeKey;
    screen.map.fitBounds(screen.activeRouteLayer.getBounds(), { padding: [40, 40] });
}

function clearActiveRoute({ cancelPending = true } = {}) {
    if (cancelPending) screen.activeRouteRequestId++;
    if (screen.activeRouteLayer) {
        screen.activeRouteLayer.remove();
        screen.activeRouteLayer = null;
    }
    screen.activeRouteKey = "";
}

function shouldShowActiveRoute(reservation) {
    return reservation.trayectoIniciado === true
        || reservation.estado === "IN_PROGRESS"
        || reservation.estado === "EN_CURSO"
        || reservation.estado === "ACTIVE"
        || reservation.estado === "PENDIENTE";
}

function routeCoordinates(reservation) {
    return [
        reservation.origenLatitud,
        reservation.origenLongitud,
        reservation.destinoLatitud ?? reservation.destino?.latitud,
        reservation.destinoLongitud ?? reservation.destino?.longitud
    ].map(Number);
}

function activeRouteKey(reservation, points) {
    if (points.some((point) => !Number.isFinite(point))) return "";
    return [
        reservation.id,
        reservation.horaInicioTrayecto ?? "",
        ...points
    ].join(":");
}

async function handleCarAction(car, metrics, action = "reserve") {
    try {
        if (action === "join") {
            await joinReservation(car.reserva.id, screen.user.id);
            showToast("Te has unido a la reserva");
        } else if (action === "cancel") {
            const reservationId = car.reserva?.id || screen.activeReservation?.id;
            await cancelReservation(reservationId, screen.user.id);
            showToast("Viaje cancelado");
        } else {
            await reserveCar({
                userId: screen.user.id,
                carId: car.id,
                tipoTrayecto: metrics.tipoTrayecto,
                officeId: metrics.officeId,
                destinoNombre: metrics.destinoNombre,
                destinoDireccion: metrics.destinoDireccion,
                destinoLatitud: metrics.destinoLatitud,
                destinoLongitud: metrics.destinoLongitud,
                startTime: metrics.startTime,
                durationMinutes: metrics.minutes,
                points: metrics.points
            });
            showToast("Reserva creada");
        }
        clearSelectedCar();
        await refreshAfterAction();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function openMenu() {
    try {
        screen.reservations = await getUserReservations(screen.user.id);
    } catch (error) {
        showToast(error.message, "error");
    }
    renderOpenMenu();
}

function renderOpenMenu() {
    renderMenuDrawer(
        document.querySelector("#menuDrawer"),
        {
            user: screen.user,
            reservations: screen.reservations,
            activeReservation: screen.activeReservation
        },
        async (reservationId) => {
            await handleStartReservation({ id: reservationId });
            closeMenuDrawer(document.querySelector("#menuDrawer"));
        },
        async (reservationId) => {
            await handleCancelReservation({ id: reservationId });
            closeMenuDrawer(document.querySelector("#menuDrawer"));
        },
        screen.logout,
        () => closeMenuDrawer(document.querySelector("#menuDrawer"))
    );
}

function rerenderMenuIfOpen() {
    if (!isMenuOpen()) return;
    renderOpenMenu();
}

function isMenuOpen() {
    const drawer = document.querySelector("#menuDrawer");
    return Boolean(drawer && !drawer.classList.contains("hidden") && drawer.innerHTML);
}

async function handleCancelReservation(reservation) {
    const reservationId = typeof reservation === "number" ? reservation : reservation.id;
    try {
        await cancelReservation(reservationId, screen.user.id);
        showToast("Reserva cancelada");
        await refreshAfterAction();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleStartReservation(reservation) {
    const reservationId = typeof reservation === "number" ? reservation : reservation.id;
    try {
        document.querySelector("#mapSummary").textContent = "Iniciando trayecto...";
        const updatedReservation = await startReservation(reservationId, screen.user.id);
        screen.activeReservation = updatedReservation;
        renderActiveReservation(screen.activeReservation);
        scheduleActiveReservationPolling(screen.activeReservation);
        drawActiveRoute(screen.activeReservation)
            .catch((error) => console.warn("No se pudo actualizar la ruta activa.", error));
        showToast("Trayecto iniciado");
        document.querySelector("#mapSummary").textContent = "Actualizando mapa...";
        refreshAfterActionInBackground();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleReadyReservation(reservationId) {
    try {
        await markReservationReady(reservationId, screen.user.id);
        showToast("Estas listo para salir");
        await refreshAfterAction();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleFinishReservation(reservationId) {
    try {
        document.querySelector("#mapSummary").textContent = "Finalizando trayecto...";
        const completedReservation = await finishReservation(reservationId, screen.user.id);
        screen.activeReservation = null;
        renderActiveReservation(null);
        clearActiveRoute();
        clearActiveReservationPolling();
        moveFinishedCarToDestination(completedReservation);
        showToast("Trayecto finalizado");
        screen.carRenderKey = "";
        document.querySelector("#mapSummary").textContent = "Colocando coche en destino...";
        renderCarsIfChanged()
            .catch((error) => showToast(error.message, "error"));
        refreshAfterActionInBackground({ loadUser: true });
        showRatingModal(completedReservation);
    } catch (error) {
        showToast(error.message, "error");
    }
}

function showRatingModal(reservation) {
    if (!reservation?.id) return;
    screen.pendingRatingReservation = reservation;
    screen.selectedRating = Number(reservation.satisfactionRating) || 0;
    renderRatingModal();
}

function renderRatingModal() {
    const container = document.querySelector("#ratingModal");
    const selectedRating = screen.selectedRating;

    container.classList.remove("hidden");
    container.innerHTML = `
        <div class="rating-backdrop"></div>
        <div class="rating-dialog" role="dialog" aria-modal="true">
            <p class="eyebrow">Valoracion</p>
            <h2>¿Qué tan satisfecho estás con este viaje?</h2>
            <div class="rating-options" role="radiogroup" aria-label="Valoracion de satisfaccion">
                ${[1, 2, 3, 4, 5].map((rating) => `
                    <button class="rating-option ${selectedRating === rating ? "selected" : ""}" data-rating="${rating}" type="button" aria-label="${rating} de 5">
                        ${rating <= selectedRating ? "★" : "☆"}
                    </button>
                `).join("")}
            </div>
            <div class="rating-actions">
                <button class="button secondary rating-skip" type="button">Ahora no</button>
                <button class="button primary rating-submit" type="button" ${selectedRating ? "" : "disabled"}>Enviar valoración</button>
            </div>
        </div>
    `;

    container.querySelector(".rating-backdrop").addEventListener("click", closeRatingModal);
    container.querySelector(".rating-skip").addEventListener("click", closeRatingModal);
    container.querySelectorAll("[data-rating]").forEach((button) => {
        button.addEventListener("click", () => {
            screen.selectedRating = Number(button.dataset.rating);
            renderRatingModal();
        });
    });
    container.querySelector(".rating-submit").addEventListener("click", submitRating);
}

async function submitRating(event) {
    const reservation = screen.pendingRatingReservation;
    const rating = screen.selectedRating;
    if (!reservation?.id || !rating) return;

    const button = event.currentTarget;
    const defaultText = button.textContent;
    button.disabled = true;
    button.textContent = "Cargando...";
    try {
        const updatedReservation = await rateReservation(reservation.id, screen.user.id, rating);
        screen.pendingRatingReservation = updatedReservation;
        showToast("Valoracion guardada");
        closeRatingModal();
        await refreshReservationsHistory();
    } catch (error) {
        showToast(error.message, "error");
        button.disabled = false;
        button.textContent = defaultText;
    }
}

function closeRatingModal() {
    screen.pendingRatingReservation = null;
    screen.selectedRating = 0;
    clearNode("#ratingModal", true);
}

async function refreshReservationsHistory() {
    screen.reservations = await getUserReservations(screen.user.id);
    rerenderMenuIfOpen();
}

function moveFinishedCarToDestination(reservation) {
    const lat = Number(reservation?.destinoLatitud ?? reservation?.destino?.latitud);
    const lng = Number(reservation?.destinoLongitud ?? reservation?.destino?.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    screen.cars = screen.cars.map((car) => {
        if (Number(car.id) !== Number(reservation.cocheId)) return car;
        return {
            ...car,
            estado: "LIBRE",
            latitud: lat,
            longitud: lng,
            plazasDisponibles: car.plazasTotales,
            reserva: null
        };
    });
}

function renderUserPill() {
    document.querySelector("#userPill").innerHTML = `
        <strong>${screen.user.nombre}</strong>
        <span>${screen.user.puntosResponsables} puntos · ${screen.user.empresaNombre}</span>
    `;
}

function renderOfficesIfChanged() {
    const nextKey = screen.offices.map(officeKey).join("|");
    if (nextKey === screen.officeRenderKey) return;
    screen.officeRenderKey = nextKey;

    screen.officeMarkers.forEach((marker) => marker.remove());
    screen.officeMarkers = [];

    screen.offices.forEach((office) => {
        const marker = L.marker([office.latitud, office.longitud], {
            zIndexOffset: -1000,
            icon: L.divIcon({
                className: "",
                html: `
                    <button class="office-pin" type="button" aria-label="${office.nombre}">
                        <span class="office-pin-icon">▦</span>
                    </button>
                `,
                iconSize: [42, 48],
                iconAnchor: [21, 44]
            })
        }).bindPopup(`<strong>${office.nombre}</strong><br>${office.direccion}`);
        marker.addTo(screen.map);
        screen.officeMarkers.push(marker);
    });
}

function officeKey(office) {
    return [office.id, office.latitud, office.longitud, office.nombre, office.direccion].join(":");
}

function fitMadrid() {
    screen.map.fitBounds([
        [40.3700, -3.7460],
        [40.4668, -3.6460]
    ], { padding: [24, 24] });
}

function pinClass(car) {
    if (car.estado === "LIBRE") return "available";
    if (car.reserva?.plazasOcupadas === 1) return "pending";
    if (car.reserva?.plazasDisponibles === 0 || car.estado === "COMPLETO") return "full";
    if (car.reserva?.plazasOcupadas >= 2) return "shared";
    return "full";
}

function showToast(message, type = "success") {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => toast.classList.add("hidden"), 2600);
}

function scheduleActiveReservationPolling(reservation) {
    clearActiveReservationPolling();
    if (!screen.user) return;

    screen.activeReservationPollTimer = setTimeout(async () => {
        try {
            await refresh(screen.sessionId, { quiet: true });
        } catch (error) {
            showToast(error.message, "error");
        }
    }, pollingDelay(reservation));
}

function clearActiveReservationPolling() {
    if (!screen.activeReservationPollTimer) return;
    clearTimeout(screen.activeReservationPollTimer);
    screen.activeReservationPollTimer = null;
}

function pollingDelay(reservation) {
    if (!reservation) return 15000;
    if (reservation.estado === "EN_CURSO" || reservation.trayectoIniciado === true) return 5000;
    return 10000;
}

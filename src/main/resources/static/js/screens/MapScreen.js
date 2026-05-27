import { renderActiveReservationCard } from "../components/ActiveReservationCard.js";
import { renderCarBottomSheet } from "../components/CarBottomSheet.js";
import { closeMenuDrawer, renderMenuDrawer } from "../components/MenuDrawer.js";
import { getVisibleCars } from "../services/carService.js";
import { getCompanyOffices } from "../services/officeService.js";
import { cancelReservation, finishReservation, getActiveReservation, getUserReservations, joinReservation, markReservationReady, reserveCar, startReservation } from "../services/reservationService.js";
import { getUser } from "../services/userService.js";

const screen = {
    user: null,
    logout: null,
    map: null,
    markers: [],
    officeMarkers: [],
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
    officeRenderKey: ""
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
        await refresh(sessionId);
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

    const shouldLoadOffices = screen.officesCompanyId !== screen.user.empresaId || !screen.offices.length;
    const shouldLoadReservations = !options.quiet || isMenuOpen();
    const shouldLoadUser = !options.quiet;
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
    renderCarsIfChanged();
    renderActiveReservationCard(
        document.querySelector("#activeReservation"),
        screen.activeReservation,
        {
            currentUser: screen.user,
            onStart: handleStartReservation,
            onReady: handleReadyReservation,
            onCancel: handleCancelReservation,
            onFinish: handleFinishReservation
        }
    );
    rerenderMenuIfOpen();
    scheduleActiveReservationPolling(screen.activeReservation);
    document.querySelector("#mapSummary").textContent = `${cars.length} coches cerca de ti`;
}

function clearMapScreen() {
    screen.markers.forEach((marker) => marker.remove());
    screen.officeMarkers.forEach((marker) => marker.remove());
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
    clearActiveReservationPolling();

    clearNode("#userPill");
    clearNode("#activeReservation", true);
    clearNode("#carBottomSheet", true);
    clearNode("#menuDrawer", true);
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

function renderCarsIfChanged() {
    const nextKey = screen.cars.map(carKey).join("|");
    if (nextKey === screen.carRenderKey) return;
    screen.carRenderKey = nextKey;

    screen.markers.forEach((marker) => marker.remove());
    screen.markers = [];

    screen.cars.forEach((car) => {
        const marker = L.marker([car.latitud, car.longitud], {
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
        await refresh();
    } catch (error) {
        showToast(error.message, "error");
    }
}

function openMenu() {
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
        await refresh();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleStartReservation(reservation) {
    const reservationId = typeof reservation === "number" ? reservation : reservation.id;
    try {
        await startReservation(reservationId, screen.user.id);
        showToast("Trayecto iniciado");
        await refresh();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleReadyReservation(reservationId) {
    try {
        await markReservationReady(reservationId, screen.user.id);
        showToast("Estas listo para salir");
        await refresh();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function handleFinishReservation(reservationId) {
    try {
        await finishReservation(reservationId, screen.user.id);
        showToast("Trayecto finalizado");
        await refresh();
    } catch (error) {
        showToast(error.message, "error");
    }
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
    if (!reservation || !["PENDIENTE", "EN_CURSO"].includes(reservation.estado)) return;

    screen.activeReservationPollTimer = setTimeout(async () => {
        try {
            await refresh(screen.sessionId, { quiet: true });
        } catch (error) {
            showToast(error.message, "error");
        }
    }, 2500);
}

function clearActiveReservationPolling() {
    if (!screen.activeReservationPollTimer) return;
    clearTimeout(screen.activeReservationPollTimer);
    screen.activeReservationPollTimer = null;
}

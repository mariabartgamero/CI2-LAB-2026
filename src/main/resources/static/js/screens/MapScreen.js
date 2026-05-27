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
    activeReservationPollTimer: null
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

async function refresh(sessionId = screen.sessionId) {
    const [cars, activeReservation, reservations, offices] = await Promise.all([
        getVisibleCars(screen.user.id),
        getActiveReservation(screen.user.id),
        getUserReservations(screen.user.id),
        getCompanyOffices(screen.user.empresaId)
    ]);
    const updatedUser = await getUser(screen.user.id);

    if (sessionId !== screen.sessionId) return;

    screen.cars = cars;
    screen.offices = offices;
    screen.activeReservation = activeReservation;
    screen.reservations = reservations;
    screen.user = updatedUser;
    localStorage.setItem("activeUser", JSON.stringify(updatedUser));

    renderUserPill();
    renderOffices();
    renderCars();
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

function renderCars() {
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
                officeId: metrics.officeId,
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

function renderOffices() {
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
            await refresh();
        } catch (error) {
            showToast(error.message, "error");
        }
    }, 5000);
}

function clearActiveReservationPolling() {
    if (!screen.activeReservationPollTimer) return;
    clearTimeout(screen.activeReservationPollTimer);
    screen.activeReservationPollTimer = null;
}

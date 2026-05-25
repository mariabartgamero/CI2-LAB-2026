const API_BASE_URL = window.location.port === "8080"
    ? window.location.origin
    : "http://localhost:8080";

const api = {
    async request(path, options = {}) {
        const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (!response.ok) {
            throw new Error(data?.error || "Error en la peticion");
        }
        return data;
    }
};

const state = {
    user: JSON.parse(localStorage.getItem("activeUser") || "null"),
    map: null,
    markers: [],
    officeMarkers: [],
    offices: [],
    cars: [],
    filter: "TODOS"
};

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const authMessage = document.querySelector("#authMessage");
const reservationMessage = document.querySelector("#reservationMessage");

document.querySelector("#loginTab").addEventListener("click", () => showAuthTab("login"));
document.querySelector("#registerTab").addEventListener("click", () => showAuthTab("register"));
document.querySelector("#loginForm").addEventListener("submit", login);
document.querySelector("#registerForm").addEventListener("submit", register);
document.querySelector("#reservationForm").addEventListener("submit", createReservation);
document.querySelector("#refreshBtn").addEventListener("click", refreshApp);
document.querySelector("#logoutBtn").addEventListener("click", logout);
document.querySelector("#fitMapBtn").addEventListener("click", fitMadrid);
document.querySelectorAll(".map-chip").forEach((button) => {
    button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        document.querySelectorAll(".map-chip").forEach((chip) => chip.classList.remove("active"));
        button.classList.add("active");
        renderCars();
    });
});

window.startReserve = (carId, label) => {
    document.querySelector("#selectedCarId").value = carId;
    document.querySelector("#selectedCarLabel").value = label;
    showMessage(reservationMessage, "Coche seleccionado. Elige destino y hora.", "success");
};

window.joinReservation = async (reservationId) => {
    try {
        await api.request(`/api/reservations/${reservationId}/join`, {
            method: "POST",
            body: JSON.stringify({ userId: state.user.id })
        });
        await refreshApp();
    } catch (error) {
        alert(error.message);
    }
};

window.finishReservation = async (reservationId) => {
    try {
        const reservation = await api.request(`/api/reservations/${reservationId}/finish`, { method: "POST" });
        await reloadUser();
        await refreshApp();
        alert(`Reserva finalizada. +25 puntos para ${reservation.usuariosApuntados.length} usuarios.`);
    } catch (error) {
        alert(error.message);
    }
};

function showAuthTab(tab) {
    document.querySelector("#loginTab").classList.toggle("active", tab === "login");
    document.querySelector("#registerTab").classList.toggle("active", tab === "register");
    document.querySelector("#loginForm").classList.toggle("hidden", tab !== "login");
    document.querySelector("#registerForm").classList.toggle("hidden", tab !== "register");
    authMessage.textContent = "";
}

async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
        const user = await api.request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password")
            })
        });
        setUser(user);
        await bootApp();
    } catch (error) {
        showMessage(authMessage, error.message, "error");
    }
}

async function register(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
        const user = await api.request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                nombre: form.get("nombre"),
                email: form.get("email"),
                password: form.get("password"),
                dni: form.get("dni"),
                codigoEmpresa: form.get("codigoEmpresa")
            })
        });
        setUser(user);
        await bootApp();
    } catch (error) {
        showMessage(authMessage, error.message, "error");
    }
}

function setUser(user) {
    state.user = user;
    localStorage.setItem("activeUser", JSON.stringify(user));
}

function logout() {
    localStorage.removeItem("activeUser");
    state.user = null;
    appView.classList.add("hidden");
    authView.classList.remove("hidden");
}

async function bootApp() {
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    renderProfile();
    setDefaultDeparture();
    initMap();
    await loadOffices();
    await refreshApp();
}

function initMap() {
    if (state.map) return;
    state.map = L.map("map", {
        zoomControl: false,
        preferCanvas: true
    }).setView([40.4168, -3.7038], 13);
    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap &copy; CARTO"
    }).addTo(state.map);
    fitMadrid();
}

async function refreshApp() {
    await Promise.all([loadCars(), loadReservations()]);
}

async function loadOffices() {
    state.offices = await api.request(`/api/offices/company/${state.user.empresaId}`);
    const select = document.querySelector("#officeSelect");
    select.innerHTML = "";
    state.offices.forEach((office) => {
        const option = document.createElement("option");
        option.value = office.id;
        option.textContent = `${office.nombre} - ${office.direccion}`;
        select.appendChild(option);
    });
    renderOffices();
}

async function loadCars() {
    state.cars = await api.request(`/api/cars/visible?userId=${state.user.id}`);
    renderCars();
}

function renderCars() {
    state.markers.forEach((marker) => marker.remove());
    state.markers = [];

    const visibleCars = state.cars.filter(matchesFilter);
    visibleCars.forEach((car) => {
        const marker = L.marker([car.latitud, car.longitud], {
            icon: L.divIcon({
                className: "",
                html: `<div class="car-marker ${markerClass(car.estado)}"></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        });
        marker.bindPopup(carPopup(car));
        marker.addTo(state.map);
        state.markers.push(marker);
    });

    document.querySelector("#mapSummary").textContent = `${visibleCars.length} de ${state.cars.length} visibles para ${state.user.empresaNombre}`;
}

function renderOffices() {
    state.officeMarkers.forEach((marker) => marker.remove());
    state.officeMarkers = [];

    state.offices.forEach((office) => {
        const marker = L.circleMarker([office.latitud, office.longitud], {
            radius: 9,
            color: "#071a2f",
            weight: 3,
            fillColor: "#b8e600",
            fillOpacity: 0.95
        });
        marker.bindPopup(`
            <div class="popup office-popup">
                <h3>${office.nombre}</h3>
                <p>${office.direccion}</p>
                <p><strong>Oficina de ${state.user.empresaNombre}</strong></p>
            </div>
        `);
        marker.addTo(state.map);
        state.officeMarkers.push(marker);
    });
}

function matchesFilter(car) {
    if (state.filter === "LIBRE") return car.estado === "LIBRE";
    if (state.filter === "RESERVA") return ["RESERVA_PENDIENTE", "RESERVA_CONFIRMADA"].includes(car.estado);
    if (state.filter === "NO_DISPONIBLE") return ["COMPLETO", "EN_USO"].includes(car.estado);
    return true;
}

function fitMadrid() {
    if (!state.map) return;
    state.map.fitBounds([
        [40.3725, -3.7420],
        [40.4628, -3.6515]
    ], { padding: [28, 28] });
}

function carPopup(car) {
    const reservation = car.reserva;
    const users = reservation?.usuariosApuntados?.length ? reservation.usuariosApuntados.join(", ") : "Sin pasajeros";
    const company = reservation ? reservation.empresaNombre : "Sin empresa asociada";
    const canReserve = car.estado === "LIBRE";
    const canJoin = reservation && ["PENDIENTE", "CONFIRMADA"].includes(reservation.estado) && car.plazasDisponibles > 0;
    const canFinish = reservation && reservation.usuariosApuntados.includes(state.user.nombre);

    return `
        <div class="popup">
            <h3>${car.matricula}</h3>
            <p><strong>Bateria:</strong> ${car.bateria}%</p>
            <p><strong>Estado:</strong> ${label(car.estado)}</p>
            <p><strong>Plazas disponibles:</strong> ${car.plazasDisponibles}/${car.plazasTotales}</p>
            <p><strong>Empresa:</strong> ${company}</p>
            <p><strong>Usuarios:</strong> ${users}</p>
            ${reservation ? `<p><strong>Destino:</strong> ${reservation.destino.nombre}</p>` : ""}
            <div class="popup-actions">
                ${canReserve ? `<button class="button primary" onclick="startReserve(${car.id}, '${car.matricula}')">Reservar</button>` : ""}
                ${canJoin ? `<button class="button primary" onclick="joinReservation(${reservation.id})">Unirme</button>` : ""}
                ${canFinish ? `<button class="button secondary" onclick="finishReservation(${reservation.id})">Finalizar</button>` : ""}
            </div>
        </div>
    `;
}

async function createReservation(event) {
    event.preventDefault();
    const reservationForm = event.currentTarget;
    const form = new FormData(reservationForm);
    const carId = form.get("carId");
    if (!carId) {
        showMessage(reservationMessage, "Selecciona primero un coche libre en el mapa.", "error");
        return;
    }

    try {
        await api.request("/api/reservations", {
            method: "POST",
            body: JSON.stringify({
                userId: state.user.id,
                carId: Number(carId),
                officeId: Number(form.get("officeId")),
                horaSalida: form.get("horaSalida")
            })
        });
        reservationForm.reset();
        document.querySelector("#selectedCarId").value = "";
        document.querySelector("#selectedCarLabel").value = "";
        setDefaultDeparture();
        showMessage(reservationMessage, "Reserva creada. Falta que se una otro companero.", "success");
        await refreshApp();
    } catch (error) {
        showMessage(reservationMessage, error.message, "error");
    }
}

async function loadReservations() {
    const reservations = await api.request(`/api/reservations/user/${state.user.id}`);
    const list = document.querySelector("#reservationList");
    list.innerHTML = "";

    if (!reservations.length) {
        list.innerHTML = "<p class='hint'>Todavia no tienes reservas.</p>";
        return;
    }

    reservations.forEach((reservation) => {
        const card = document.createElement("article");
        card.className = "reservation-card";
        card.innerHTML = `
            <strong>${reservation.matricula} -> ${reservation.destino.nombre}</strong>
            <p>${label(reservation.estado)} · ${reservation.plazasOcupadas}/5 plazas · ${formatDate(reservation.horaSalida)}</p>
            ${["PENDIENTE", "CONFIRMADA", "COMPLETA"].includes(reservation.estado)
                ? `<button class="button secondary" onclick="finishReservation(${reservation.id})">Finalizar trayecto</button>`
                : ""}
        `;
        list.appendChild(card);
    });
}

async function reloadUser() {
    const user = await api.request(`/api/users/${state.user.id}`);
    setUser(user);
    renderProfile();
}

function renderProfile() {
    document.querySelector("#profileName").textContent = state.user.nombre;
    document.querySelector("#profileCompany").textContent = `${state.user.empresaNombre} · ${state.user.codigoEmpresa}`;
    document.querySelector("#profilePoints").textContent = state.user.puntosResponsables;
}

function setDefaultDeparture() {
    const input = document.querySelector("#departureInput");
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(8, 30, 0, 0);
    input.value = toDateTimeLocal(date);
}

function toDateTimeLocal(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function markerClass(status) {
    if (status === "LIBRE") return "free";
    if (status === "RESERVA_PENDIENTE") return "pending";
    if (status === "RESERVA_CONFIRMADA") return "confirmed";
    return "blocked";
}

function label(value) {
    return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value) {
    return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
}

if (state.user) {
    bootApp();
}

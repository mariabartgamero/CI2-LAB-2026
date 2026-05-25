if (!API.token()) {
    window.location.href = "/login.html";
}

const employee = API.employee();
const userBadge = document.querySelector("#userBadge");
if (employee && userBadge) {
    userBadge.textContent = `${employee.name} · ${employee.company.name}`;
}

document.querySelector("#logoutBtn")?.addEventListener("click", () => {
    API.clearSession();
    window.location.href = "/";
});

document.querySelector("#searchCarsForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    ["lat", "lng", "radiusKm"].forEach((field) => {
        const value = form.get(field);
        if (value) params.set(field, value);
    });
    const cars = await API.request(`/api/cars/available?${params.toString()}`);
    renderCars(cars);
});

document.querySelector("#reservationForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = document.querySelector("#reservationMessage");

    try {
        await API.request("/api/reservations", {
            method: "POST",
            body: JSON.stringify({
                carId: Number(form.get("carId")),
                originLatitude: Number(form.get("originLatitude")),
                originLongitude: Number(form.get("originLongitude")),
                destination: form.get("destination"),
                startTime: toLocalDateTime(form.get("startTime")),
                endTime: toLocalDateTime(form.get("endTime"))
            })
        });
        message.textContent = "Reserva creada correctamente.";
        message.className = "message success";
        event.currentTarget.reset();
        await refreshAll();
    } catch (error) {
        message.textContent = error.message;
        message.className = "message error";
    }
});

document.querySelector("#refreshRidesBtn")?.addEventListener("click", loadCompanyRides);
document.querySelector("#refreshMineBtn")?.addEventListener("click", loadMyReservations);

function toLocalDateTime(value) {
    return value.length === 16 ? `${value}:00` : value;
}

function renderCars(cars) {
    const list = document.querySelector("#carsList");
    list.innerHTML = cars.length ? "" : "<p class='muted'>No hay coches disponibles.</p>";
    cars.forEach((car) => {
        list.appendChild(item(
            `#${car.id} ${car.brand} ${car.model}`,
            `${car.licensePlate} · ${car.capacity} plazas · ${car.latitude}, ${car.longitude}`,
            null
        ));
    });
}

async function loadCompanyRides() {
    const rides = await API.request("/api/rides/company/available");
    const list = document.querySelector("#companyRidesList");
    list.innerHTML = rides.length ? "" : "<p class='muted'>No hay trayectos con plazas libres.</p>";
    rides.forEach((ride) => {
        const button = document.createElement("button");
        button.className = "button primary";
        button.textContent = "Unirme";
        button.addEventListener("click", async () => {
            await API.request(`/api/reservations/${ride.id}/join`, { method: "POST" });
            await refreshAll();
        });

        list.appendChild(item(
            `${ride.destination} · ${ride.status}`,
            `${ride.car.brand} ${ride.car.model} · ${ride.participants}/${ride.capacity} plazas · ${formatDate(ride.startTime)}`,
            button
        ));
    });
}

async function loadMyReservations() {
    const reservations = await API.request("/api/reservations/me");
    const list = document.querySelector("#myReservationsList");
    list.innerHTML = reservations.length ? "" : "<p class='muted'>Todavia no tienes reservas.</p>";
    reservations.forEach((reservation) => {
        const button = document.createElement("button");
        button.className = "button secondary";
        button.textContent = "Cancelar";
        button.addEventListener("click", async () => {
            await API.request(`/api/reservations/${reservation.id}/cancel`, { method: "POST" });
            await refreshAll();
        });

        list.appendChild(item(
            `${reservation.destination} · ${reservation.status}`,
            `${reservation.car.brand} ${reservation.car.model} · ${reservation.participants}/${reservation.capacity} plazas · ${formatDate(reservation.startTime)}`,
            button
        ));
    });
}

function item(title, description, action) {
    const wrapper = document.createElement("div");
    wrapper.className = "item";

    const content = document.createElement("div");
    const strong = document.createElement("strong");
    const p = document.createElement("p");
    strong.textContent = title;
    p.textContent = description;
    content.append(strong, p);
    wrapper.appendChild(content);
    if (action) wrapper.appendChild(action);
    return wrapper;
}

function formatDate(value) {
    return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
}

async function refreshAll() {
    await Promise.all([loadCompanyRides(), loadMyReservations()]);
}

refreshAll();

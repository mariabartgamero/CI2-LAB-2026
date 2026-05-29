import { formatDateTime } from "../utils/dateTime.js";

const CATEGORIES = [
    { value: "RESERVA", label: "Reserva" },
    { value: "COCHE", label: "Coche" },
    { value: "ACCIDENTE_EMERGENCIA", label: "Accidente o emergencia" },
    { value: "OBJETO_PERDIDO", label: "Objeto perdido" },
    { value: "OTRO", label: "Otro" }
];

const TYPES_BY_CATEGORY = {
    RESERVA: [
        "NO_PUEDO_INICIAR_RESERVA",
        "NO_PUEDO_FINALIZAR_RESERVA",
        "RESERVA_SIGUE_ACTIVA",
        "NO_APARECE_RESERVA",
        "COCHE_RESERVADO_NO_DISPONIBLE",
        "UBICACION_COCHE_NO_COINCIDE",
        "CANCELAR_RESERVA",
        "MODIFICAR_RESERVA"
    ],
    COCHE: [
        "COCHE_NO_ARRANCA",
        "COCHE_NO_ABRE",
        "COCHE_NO_CIERRA",
        "COCHE_SUCIO",
        "DANOS_VISIBLES",
        "POCA_BATERIA_O_COMBUSTIBLE",
        "LUZ_AVISO_ENCENDIDA",
        "RUIDO_EXTRANO",
        "COCHE_NO_ESTA_EN_UBICACION",
        "OTRO_PROBLEMA_COCHE"
    ],
    ACCIDENTE_EMERGENCIA: [
        "ACCIDENTE",
        "AVERIA_DURANTE_TRAYECTO",
        "DANOS_GRAVES",
        "USUARIO_BLOQUEADO",
        "COCHE_ROBADO",
        "ASISTENCIA_URGENTE"
    ],
    OBJETO_PERDIDO: [
        "OBJETO_PERDIDO",
        "OBJETO_ENCONTRADO",
        "RECUPERAR_OBJETO",
        "INFORMAR_OBJETO"
    ],
    OTRO: [
        "CONSULTA_GENERAL",
        "PROBLEMA_NO_ESPECIFICADO",
        "OTRO"
    ]
};

let chatState = initialChatState();

export function renderIncidentChat(container, { user, incidencias = [], activeReservation }, onCreate) {
    container.innerHTML = `
        <div class="incident-chat">
            <div class="incident-thread">
                ${chatState.messages.map(messageBubble).join("")}
            </div>
            ${actionsTemplate()}
            ${descriptionTemplate()}
        </div>
        <div class="incident-list">
            <h4>Mis incidencias</h4>
            ${incidencias.length ? incidencias.map(incidentCard).join("") : "<p class='empty-copy'>Todavia no has creado incidencias.</p>"}
        </div>
    `;

    bindChatActions(container, user, activeReservation, incidencias, onCreate);
}

function bindChatActions(container, user, activeReservation, incidencias, onCreate) {
    container.querySelectorAll("[data-incident-category]").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.incidentCategory;
            chatState.category = value;
            chatState.type = "";
            chatState.description = "";
            addUserMessage(labelForCategory(value));
            addBotMessage("Cuéntame qué problema has tenido.");
            chatState.step = "type";
            renderIncidentChat(container, { user, incidencias, activeReservation }, onCreate);
        });
    });

    container.querySelectorAll("[data-incident-type]").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.incidentType;
            chatState.type = value;
            addUserMessage(labelForType(value));
            addBotMessage("Describe brevemente qué ha ocurrido.");
            chatState.step = "description";
            renderIncidentChat(container, { user, incidencias, activeReservation }, onCreate);
        });
    });

    container.querySelector("[data-incident-description-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = container.querySelector("#incidentDescriptionInput");
        const description = input.value.trim();
        if (!description) return;
        chatState.description = description;
        addUserMessage(description);
        addBotMessage(summaryText());
        chatState.step = "confirm";
        renderIncidentChat(container, { user, incidencias, activeReservation }, onCreate);
    });

    container.querySelector("[data-incident-confirm]")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Cargando...";
        try {
            const created = await onCreate?.({
                userId: user.id,
                reservationId: activeReservation?.id ?? null,
                carId: activeReservation?.cocheId ?? null,
                categoria: chatState.category,
                tipoIncidencia: chatState.type,
                descripcion: chatState.description
            });
            addBotMessage("Tu incidencia se ha creado correctamente.");
            chatState = {
                ...initialChatState(),
                messages: [...chatState.messages, botMessage("Puedes comunicar otra incidencia cuando quieras.")]
            };
            renderIncidentChat(
                    container,
                    { user, incidencias: created ? [created, ...incidencias] : incidencias, activeReservation },
                    onCreate
            );
        } catch (error) {
            addBotMessage(error.message);
            chatState.step = "confirm";
            renderIncidentChat(container, { user, incidencias, activeReservation }, onCreate);
        }
    });

    container.querySelector("[data-incident-cancel]")?.addEventListener("click", () => {
        addBotMessage("La incidencia ha sido cancelada.");
        chatState = {
            ...initialChatState(),
            messages: [...chatState.messages, botMessage("Hola, ¿qué tipo de incidencia quieres comunicar?")]
        };
        renderIncidentChat(container, { user, incidencias, activeReservation }, onCreate);
    });
}

function actionsTemplate() {
    if (chatState.step === "category") {
        return `<div class="incident-actions">${CATEGORIES.map((category) => `
            <button class="incident-choice" data-incident-category="${category.value}" type="button">${category.label}</button>
        `).join("")}</div>`;
    }

    if (chatState.step === "type") {
        return `<div class="incident-actions">${TYPES_BY_CATEGORY[chatState.category].map((type) => `
            <button class="incident-choice" data-incident-type="${type}" type="button">${labelForType(type)}</button>
        `).join("")}</div>`;
    }

    if (chatState.step === "confirm") {
        return `
            <div class="incident-actions two">
                <button class="incident-choice primary-choice" data-incident-confirm type="button">Confirmar incidencia</button>
                <button class="incident-choice" data-incident-cancel type="button">Cancelar</button>
            </div>
        `;
    }

    return "";
}

function descriptionTemplate() {
    if (chatState.step !== "description") return "";
    return `
        <form class="incident-description" data-incident-description-form>
            <input id="incidentDescriptionInput" type="text" placeholder="Escribe una descripcion breve" autocomplete="off" required>
            <button class="button primary" type="submit">Enviar</button>
        </form>
    `;
}

function incidentCard(incidencia) {
    return `
        <article class="incident-card">
            <div class="drawer-reservation-head">
                <strong>${labelForCategory(incidencia.categoria)}</strong>
                <span class="reservation-status">${labelForStatus(incidencia.estado)}</span>
            </div>
            <span>${labelForType(incidencia.tipoIncidencia)}</span>
            <p>${escapeHtml(incidencia.descripcion)}</p>
            <span>Prioridad: ${labelForPriority(incidencia.prioridad)}</span>
            <span>${formatDateTime(incidencia.fechaCreacion)}</span>
        </article>
    `;
}

function messageBubble(message) {
    return `
        <div class="chat-row ${message.sender}">
            <div class="chat-bubble">${escapeHtml(message.text)}</div>
        </div>
    `;
}

function summaryText() {
    return [
        "Resumen de la incidencia:",
        `Categoria: ${labelForCategory(chatState.category)}`,
        `Tipo: ${labelForType(chatState.type)}`,
        `Descripcion: ${chatState.description}`
    ].join("\n");
}

function initialChatState() {
    return {
        step: "category",
        category: "",
        type: "",
        description: "",
        messages: [botMessage("Hola, ¿qué tipo de incidencia quieres comunicar?")]
    };
}

function addBotMessage(text) {
    chatState.messages.push(botMessage(text));
}

function addUserMessage(text) {
    chatState.messages.push({ sender: "user", text });
}

function botMessage(text) {
    return { sender: "bot", text };
}

function labelForCategory(value) {
    return CATEGORIES.find((category) => category.value === value)?.label ?? value;
}

function labelForType(value) {
    const labels = {
        NO_PUEDO_INICIAR_RESERVA: "No puedo iniciar reserva",
        NO_PUEDO_FINALIZAR_RESERVA: "No puedo finalizar reserva",
        RESERVA_SIGUE_ACTIVA: "La reserva sigue activa",
        NO_APARECE_RESERVA: "No aparece mi reserva",
        COCHE_RESERVADO_NO_DISPONIBLE: "Coche reservado no disponible",
        UBICACION_COCHE_NO_COINCIDE: "La ubicacion del coche no coincide",
        CANCELAR_RESERVA: "Cancelar reserva",
        MODIFICAR_RESERVA: "Modificar reserva",
        COCHE_NO_ARRANCA: "El coche no arranca",
        COCHE_NO_ABRE: "El coche no abre",
        COCHE_NO_CIERRA: "El coche no cierra",
        COCHE_SUCIO: "Coche sucio",
        DANOS_VISIBLES: "Danos visibles",
        POCA_BATERIA_O_COMBUSTIBLE: "Poca bateria o combustible",
        LUZ_AVISO_ENCENDIDA: "Luz de aviso encendida",
        RUIDO_EXTRANO: "Ruido extrano",
        COCHE_NO_ESTA_EN_UBICACION: "El coche no esta en la ubicacion",
        OTRO_PROBLEMA_COCHE: "Otro problema del coche",
        ACCIDENTE: "Accidente",
        AVERIA_DURANTE_TRAYECTO: "Averia durante el trayecto",
        DANOS_GRAVES: "Danos graves",
        USUARIO_BLOQUEADO: "Usuario bloqueado",
        COCHE_ROBADO: "Coche robado",
        ASISTENCIA_URGENTE: "Asistencia urgente",
        OBJETO_PERDIDO: "Objeto perdido",
        OBJETO_ENCONTRADO: "Objeto encontrado",
        RECUPERAR_OBJETO: "Recuperar objeto",
        INFORMAR_OBJETO: "Informar objeto",
        CONSULTA_GENERAL: "Consulta general",
        PROBLEMA_NO_ESPECIFICADO: "Problema no especificado",
        OTRO: "Otro"
    };
    return labels[value] ?? value;
}

function labelForStatus(value) {
    const labels = {
        ABIERTA: "abierta",
        EN_PROCESO: "en proceso",
        RESUELTA: "resuelta",
        CERRADA: "cerrada"
    };
    return labels[value] ?? String(value).toLowerCase();
}

function labelForPriority(value) {
    const labels = {
        BAJA: "baja",
        MEDIA: "media",
        ALTA: "alta",
        URGENTE: "urgente"
    };
    return labels[value] ?? String(value).toLowerCase();
}

function escapeHtml(value) {
    return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;")
            .replaceAll("\n", "<br>");
}

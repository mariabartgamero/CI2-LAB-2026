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

const OPERATOR_PHONE = "+34672184744";

let chatState = initialChatState();

export function resetIncidentChatState() {
    chatState = initialChatState();
}

export function renderIncidentChat(container, { user, reservations = [] }, onCreate) {
    container.innerHTML = `
        <div class="incident-chat">
            <div class="incident-thread">
                ${chatState.messages.map(messageBubble).join("")}
            </div>
            ${actionsTemplate(reservations)}
            ${descriptionTemplate()}
        </div>
    `;
    bindChatActions(container, user, reservations, onCreate);
}

function bindChatActions(container, user, reservations, onCreate) {
    container.querySelectorAll("[data-incident-reservation]").forEach((button) => {
        button.addEventListener("click", () => {
            const raw = button.dataset.incidentReservation;
            chatState.reservationId = raw ? Number(raw) : null;
            const reservation = reservations.find((r) => r.id === chatState.reservationId);
            chatState.matricula = reservation?.matricula ?? null;
            addUserMessage(reservation ? reservationLabel(reservation) : "Sin reserva asociada");
            addBotMessage("¿Qué tipo de incidencia quieres comunicar?");
            chatState.step = "category";
            renderIncidentChat(container, { user, reservations }, onCreate);
        });
    });

    container.querySelectorAll("[data-incident-category]").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.incidentCategory;
            chatState.category = value;
            chatState.type = "";
            chatState.description = "";
            addUserMessage(labelForCategory(value));
            addBotMessage("Cuéntame qué problema has tenido.");
            chatState.step = "type";
            renderIncidentChat(container, { user, reservations }, onCreate);
        });
    });

    container.querySelectorAll("[data-incident-type]").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.incidentType;
            chatState.type = value;
            addUserMessage(labelForType(value));
            addBotMessage("Describe brevemente qué ha ocurrido.");
            chatState.step = "description";
            renderIncidentChat(container, { user, reservations }, onCreate);
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
        renderIncidentChat(container, { user, reservations }, onCreate);
    });

    container.querySelector("[data-incident-confirm]")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Cargando...";
        try {
            const reservation = reservations.find((r) => r.id === chatState.reservationId);
            await onCreate?.({
                userId: user.id,
                reservationId: chatState.reservationId,
                carId: reservation?.cocheId ?? null,
                categoria: chatState.category,
                tipoIncidencia: chatState.type,
                descripcion: chatState.description
            });
            addBotMessage("Tu incidencia se ha creado correctamente.");
            addBotMessage("¿Quieres ponerte en contacto con un operario?");
            const msgs = chatState.messages;
            chatState = { ...initialChatState(), step: "contact", messages: msgs };
            renderIncidentChat(container, { user, reservations }, onCreate);
        } catch (error) {
            addBotMessage(error.message);
            chatState.step = "confirm";
            renderIncidentChat(container, { user, reservations }, onCreate);
        }
    });

    container.querySelector("[data-incident-cancel]")?.addEventListener("click", () => {
        addBotMessage("La incidencia ha sido cancelada.");
        const msgs = chatState.messages;
        chatState = {
            ...initialChatState(),
            messages: [...msgs, botMessage("¿Para qué reserva quieres comunicar la nueva incidencia?")]
        };
        renderIncidentChat(container, { user, reservations }, onCreate);
    });

    container.querySelectorAll("[data-incident-contact]").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.incidentContact;
            if (value === "yes") {
                addUserMessage("Sí");
                addBotMessage("Aquí tienes el número de contacto del operario.");
                chatState.step = "call";
            } else {
                addUserMessage("No");
                addBotMessage("¿Quieres comunicar otra incidencia?");
                chatState.step = "restart";
            }
            renderIncidentChat(container, { user, reservations }, onCreate);
        });
    });

    container.querySelector("[data-incident-done]")?.addEventListener("click", () => {
        addBotMessage("¿Quieres comunicar otra incidencia?");
        chatState.step = "restart";
        renderIncidentChat(container, { user, reservations }, onCreate);
    });

    container.querySelectorAll("[data-incident-restart]").forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.incidentRestart;
            if (value === "yes") {
                addUserMessage("Sí");
                const msgs = chatState.messages;
                chatState = {
                    ...initialChatState(),
                    messages: [...msgs, botMessage("¿Para qué reserva quieres reportar la nueva incidencia?")]
                };
            } else {
                addUserMessage("No");
                addBotMessage("¡Hasta pronto! Tu incidencia ha quedado registrada.");
                chatState.step = "done";
            }
            renderIncidentChat(container, { user, reservations }, onCreate);
        });
    });
}

function actionsTemplate(reservations) {
    if (chatState.step === "reservation") {
        const recent = recentReservations(reservations);
        return `
            <div class="incident-actions incident-actions-col">
                ${recent.map((r) => `
                    <button class="incident-choice" data-incident-reservation="${r.id}" type="button">${escapeHtml(reservationLabel(r))}</button>
                `).join("")}
                <button class="incident-choice" data-incident-reservation="" type="button">Sin reserva asociada</button>
            </div>
        `;
    }

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

    if (chatState.step === "contact") {
        return `
            <div class="incident-actions two">
                <button class="incident-choice primary-choice" data-incident-contact="yes" type="button">Sí</button>
                <button class="incident-choice" data-incident-contact="no" type="button">No</button>
            </div>
        `;
    }

    if (chatState.step === "call") {
        return `
            <div class="incident-actions two">
                <a class="incident-choice primary-choice" href="tel:${OPERATOR_PHONE}">📞 Llamar</a>
                <button class="incident-choice" data-incident-done type="button">Continuar</button>
            </div>
        `;
    }

    if (chatState.step === "restart") {
        return `
            <div class="incident-actions two">
                <button class="incident-choice primary-choice" data-incident-restart="yes" type="button">Sí</button>
                <button class="incident-choice" data-incident-restart="no" type="button">No</button>
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

export function incidentCard(incidencia) {
    return `
        <article class="incident-card">
            <div class="drawer-reservation-head">
                <strong>${labelForCategory(incidencia.categoria)}</strong>
                <span class="reservation-status">${labelForStatus(incidencia.estado)}</span>
            </div>
            <span>${labelForType(incidencia.tipoIncidencia)}</span>
            ${incidencia.matricula ? `<span>Matricula: ${escapeHtml(incidencia.matricula)}</span>` : ""}
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
    const lines = [
        "Resumen de la incidencia:"
    ];
    if (chatState.matricula) lines.push(`Matricula: ${chatState.matricula}`);
    lines.push(
        `Categoria: ${labelForCategory(chatState.category)}`,
        `Tipo: ${labelForType(chatState.type)}`,
        `Descripcion: ${chatState.description}`
    );
    return lines.join("\n");
}

function initialChatState() {
    return {
        step: "reservation",
        reservationId: null,
        matricula: null,
        category: "",
        type: "",
        description: "",
        messages: [botMessage("¿Para qué reserva quieres reportar la incidencia?")]
    };
}

function recentReservations(reservations) {
    return [...reservations]
        .sort((a, b) => new Date(b.horaSalida) - new Date(a.horaSalida))
        .slice(0, 3);
}

function reservationLabel(reservation) {
    return `${destinationName(reservation)} · ${formatDateTime(reservation.horaSalida)}`;
}

function destinationName(reservation) {
    return reservation.destinoNombre ?? reservation.destino?.nombre ?? "Destino";
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

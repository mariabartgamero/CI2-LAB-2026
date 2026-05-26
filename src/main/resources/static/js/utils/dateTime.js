const MAX_ADVANCE_HOURS = 12;

export function defaultStartTimeValue() {
    return toDateTimeLocalValue(roundUpMinutes(new Date(), 15));
}

export function validateStartTime(value) {
    if (!value) {
        return "Selecciona una hora de inicio";
    }

    const selectedDate = new Date(value);
    if (Number.isNaN(selectedDate.getTime())) {
        return "La hora de inicio no es valida";
    }

    const now = new Date();
    if (selectedDate < now) {
        return "La hora de inicio no puede estar en el pasado";
    }

    const maxDate = new Date(now.getTime() + MAX_ADVANCE_HOURS * 60 * 60 * 1000);
    if (selectedDate > maxDate) {
        return "Solo puedes reservar con 12 horas de antelacion como maximo";
    }

    return null;
}

export function localDateTimePayload(value) {
    const date = new Date(value);
    return toDateTimeLocalValue(date) + ":00";
}

export function estimatedArrivalLabel(startTimeValue, minutes) {
    if (!startTimeValue) return "";
    const date = new Date(startTimeValue);
    if (Number.isNaN(date.getTime())) return "";
    date.setMinutes(date.getMinutes() + minutes);
    return new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

export function formatDateTime(value) {
    return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
}

function roundUpMinutes(date, step) {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const nextMinutes = Math.ceil(minutes / step) * step;
    if (nextMinutes === 60) {
        rounded.setHours(rounded.getHours() + 1);
        rounded.setMinutes(0, 0, 0);
    } else {
        rounded.setMinutes(nextMinutes, 0, 0);
    }
    return rounded;
}

function toDateTimeLocalValue(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

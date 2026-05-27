import { apiRequest } from "./api.js";

export function reserveCar({ userId, carId, officeId, startTime, durationMinutes, points }) {
    return apiRequest("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
            userId,
            carId,
            officeId,
            horaSalida: startTime,
            duracionMinutos: durationMinutes,
            puntosPrevistos: points
        })
    });
}

export function cancelReservation(reservationId, userId) {
    return apiRequest(`/api/reservations/${reservationId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ userId })
    });
}

export function joinReservation(reservationId, userId) {
    return apiRequest(`/api/reservations/${reservationId}/join`, {
        method: "POST",
        body: JSON.stringify({ userId })
    });
}

export function startReservation(reservationId, userId) {
    return apiRequest(`/api/reservations/${reservationId}/start`, {
        method: "POST",
        body: JSON.stringify({ userId })
    });
}

export function markReservationReady(reservationId, userId) {
    return apiRequest(`/api/reservations/${reservationId}/ready`, {
        method: "POST",
        body: JSON.stringify({ userId })
    });
}

export function finishReservation(reservationId, userId) {
    return apiRequest(`/api/reservations/${reservationId}/finish`, {
        method: "POST",
        body: JSON.stringify({ userId })
    });
}

export function getActiveReservation(userId) {
    return apiRequest(`/api/reservations/user/${userId}/active`);
}

export function getUserReservations(userId) {
    return apiRequest(`/api/reservations/user/${userId}`);
}

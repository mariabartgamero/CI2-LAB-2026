import { apiRequest } from "./api.js";

export function createIncidencia(payload) {
    return apiRequest("/api/incidencias", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function getIncidencias() {
    return apiRequest("/api/incidencias");
}

export function getUserIncidencias(userId) {
    return apiRequest(`/api/incidencias/user/${userId}`);
}

export function getIncidencia(incidenciaId) {
    return apiRequest(`/api/incidencias/${incidenciaId}`);
}

export function updateIncidenciaEstado(incidenciaId, estado) {
    return apiRequest(`/api/incidencias/${incidenciaId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado })
    });
}

export function deleteIncidencia(incidenciaId) {
    return apiRequest(`/api/incidencias/${incidenciaId}`, {
        method: "DELETE"
    });
}

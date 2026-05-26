import { apiRequest } from "./api.js";

export function login(email, password) {
    return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
}

export function register(payload) {
    return apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

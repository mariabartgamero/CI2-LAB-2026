export const API_BASE_URL = window.location.port === "8080"
    ? window.location.origin
    : "http://localhost:8080";

export async function apiRequest(path, options = {}) {
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

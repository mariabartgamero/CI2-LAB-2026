const API = {
    token() {
        return localStorage.getItem("token");
    },

    setSession(authResponse) {
        localStorage.setItem("token", authResponse.token);
        localStorage.setItem("employee", JSON.stringify(authResponse.employee));
    },

    clearSession() {
        localStorage.removeItem("token");
        localStorage.removeItem("employee");
    },

    employee() {
        const raw = localStorage.getItem("employee");
        return raw ? JSON.parse(raw) : null;
    },

    async request(path, options = {}) {
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const token = API.token();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(path, { ...options, headers });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            throw new Error(data?.error || "Request failed");
        }

        return data;
    }
};

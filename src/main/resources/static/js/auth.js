const message = document.querySelector("#message");

function showMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.className = `message ${type}`;
}

document.querySelector("#loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
        const auth = await API.request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password")
            })
        });
        API.setSession(auth);
        window.location.href = "/dashboard.html";
    } catch (error) {
        showMessage(error.message);
    }
});

document.querySelector("#registerForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
        const auth = await API.request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                name: form.get("name"),
                email: form.get("email"),
                password: form.get("password"),
                companyName: form.get("companyName")
            })
        });
        API.setSession(auth);
        window.location.href = "/dashboard.html";
    } catch (error) {
        showMessage(error.message);
    }
});

import { login, register } from "./js/services/authService.js";
import { apiRequest } from "./js/services/api.js";
import { initMapScreen, resetMapScreen } from "./js/screens/MapScreen.js";

const state = {
    user: null,
    companyCodes: new Set(["TEL2026", "REP2026", "END2026", "ACC2026"]),
    companyCodeLength: 7,
    companiesLoaded: false
};

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const authMessage = document.querySelector("#authMessage");
const authTitle = document.querySelector("#authTitle");
const authSubtitle = document.querySelector("#authSubtitle");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const loginEmailInput = document.querySelector("#loginEmail");
const loginEmailError = document.querySelector("#loginEmailError");
const registerEmailInput = document.querySelector("#registerEmail");
const registerEmailError = document.querySelector("#registerEmailError");
const registerDniInput = document.querySelector("#registerDni");
const dniError = document.querySelector("#dniError");
const companyCodeInput = document.querySelector("#companyCode");
const companyError = document.querySelector("#companyError");

document.querySelector("#loginTab").addEventListener("click", () => showAuthTab("login"));
document.querySelector("#registerTab").addEventListener("click", () => showAuthTab("register"));
loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
registerForm.addEventListener("input", updateRegisterState);
loginEmailInput.addEventListener("input", () => {
    if (isValidEmail(cleanEmail(loginEmailInput.value))) {
        showLoginEmailError(false);
    }
});
document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => togglePassword(button));
});

forceLoginView();
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        forceLoginView();
    }
});
loadCompaniesForRegister();

function showAuthTab(tab) {
    document.querySelector("#loginTab").classList.toggle("active", tab === "login");
    document.querySelector("#registerTab").classList.toggle("active", tab === "register");
    loginForm.classList.toggle("hidden", tab !== "login");
    registerForm.classList.toggle("hidden", tab !== "register");
    authMessage.textContent = "";
    authMessage.className = "message";
    showLoginEmailError(false);
    authTitle.textContent = tab === "login" ? "Bienvenido de nuevo" : "Alta de empleado";
    authSubtitle.textContent = tab === "login"
        ? "Gestiona tus reservas y viajes."
        : "Usa el código de tu empresa.";
    if (tab === "register") {
        loadCompaniesForRegister();
        updateRegisterState();
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const email = cleanEmail(form.get("email"));
    const password = String(form.get("password") || "");
    if (!isValidEmail(email)) {
        showLoginEmailError(true);
        showAuthError("CORREO NO VALIDO");
        return;
    }
    showLoginEmailError(false);
    if (!password) {
        showAuthError("Introduce tu contrasena.");
        return;
    }
    setAuthLoading(formElement, true, "Entrando...");
    try {
        const user = await login(email, password);
        startSession(user);
    } catch (error) {
        showAuthError(error.message);
    } finally {
        setAuthLoading(formElement, false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
        nombre: cleanText(form.get("nombre")),
        email: cleanEmail(form.get("email")),
        password: String(form.get("password") || ""),
        confirmPassword: String(form.get("confirmPassword") || ""),
        dni: cleanText(form.get("dni")).toUpperCase(),
        codigoEmpresa: cleanText(form.get("codigoEmpresa")).toUpperCase()
    };
    const validationError = validateRegister(payload);
    if (validationError) {
        showAuthError(validationError);
        return;
    }
    setAuthLoading(formElement, true, "Creando cuenta...");
    try {
        const user = await register({
            nombre: payload.nombre,
            email: payload.email,
            password: payload.password,
            dni: payload.dni,
            codigoEmpresa: payload.codigoEmpresa
        });
        startSession(user);
    } catch (error) {
        showAuthError(error.message);
    } finally {
        setAuthLoading(formElement, false);
        updateRegisterState();
    }
}

function validateRegister(payload) {
    if (payload.nombre.length < 3) return "Introduce tu nombre completo.";
    if (!isValidEmail(payload.email)) return "CORREO NO VALIDO";
    if (payload.password.length < 6) return "La contrasena debe tener al menos 6 caracteres.";
    if (payload.password !== payload.confirmPassword) return "Las contrasenas no coinciden.";
    if (!isValidDni(payload.dni)) return "DNI INCORRECTO";
    if (!isValidCompanyCode(payload.codigoEmpresa)) return "EMPRESA INCORRECTA";
    return "";
}

function updateRegisterState() {
    const dni = cleanText(registerDniInput.value).toUpperCase();
    const companyCode = cleanText(companyCodeInput.value).toUpperCase();
    const registerEmail = cleanEmail(registerEmailInput.value);
    const isDniComplete = dni.length === 9;
    const isDniValid = isValidDni(dni);
    const hasRegisterEmail = registerEmail.length > 0;
    const isRegisterEmailValid = isValidEmail(registerEmail);
    const isCompanyComplete = companyCode.length === state.companyCodeLength;
    const isCompanyValid = isValidCompanyCode(companyCode);
    const submit = registerForm.querySelector(".auth-submit");

    registerDniInput.value = dni;
    registerEmailInput.value = registerEmail;
    companyCodeInput.value = companyCode;
    registerEmailInput.classList.toggle("invalid", hasRegisterEmail && !isRegisterEmailValid);
    registerEmailError.classList.toggle("hidden", !hasRegisterEmail || isRegisterEmailValid);
    registerDniInput.classList.toggle("invalid", isDniComplete && !isDniValid);
    dniError.classList.toggle("hidden", !isDniComplete || isDniValid);
    companyCodeInput.classList.toggle("invalid", isCompanyComplete && !isCompanyValid);
    companyError.classList.toggle("hidden", !isCompanyComplete || isCompanyValid);
    submit.disabled = !isRegisterEmailValid || !isDniValid || !isCompanyValid;
}

async function loadCompaniesForRegister() {
    if (state.companiesLoaded) return;
    try {
        const companies = await apiRequest("/api/companies");
        const codes = companies.map((company) => company.codigoEmpresa.toUpperCase());
        state.companyCodes = new Set(codes);
        state.companyCodeLength = Math.max(...codes.map((code) => code.length), state.companyCodeLength);
        companyCodeInput.maxLength = state.companyCodeLength;
    } catch (error) {
        state.companyCodes = new Set(["TEL2026", "REP2026", "END2026", "ACC2026"]);
        state.companyCodeLength = 7;
        companyCodeInput.maxLength = state.companyCodeLength;
    } finally {
        state.companiesLoaded = true;
        updateRegisterState();
    }
}

function togglePassword(button) {
    const input = button.previousElementSibling;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "✕" : "👁";
    button.setAttribute("aria-label", isHidden ? "Ocultar contrasena" : "Mostrar contrasena");
    button.title = isHidden ? "Ocultar contrasena" : "Mostrar contrasena";
}

function setAuthLoading(form, isLoading, label) {
    const button = form.querySelector(".auth-submit");
    if (!button.dataset.defaultText) {
        button.dataset.defaultText = button.textContent;
    }
    button.disabled = isLoading;
    button.textContent = isLoading ? label : button.dataset.defaultText;
}

function isValidDni(dni) {
    return /^[0-9]{8}[A-Z]$/.test(dni);
}

function isValidCompanyCode(code) {
    return state.companyCodes.has(code);
}

function isValidEmail(email) {
    return email.includes("@");
}

function showLoginEmailError(show) {
    loginEmailInput.classList.toggle("invalid", show);
    loginEmailError.classList.toggle("hidden", !show);
}

function cleanEmail(value) {
    return cleanText(value).toLowerCase();
}

function cleanText(value) {
    return String(value || "").trim();
}

function startSession(user) {
    state.user = user;
    localStorage.removeItem("activeUser");
    resetMapScreen();
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    initMapScreen(user, logout);
}

function logout() {
    forceLoginView();
}

function forceLoginView() {
    localStorage.removeItem("activeUser");
    sessionStorage.removeItem("activeUser");
    state.user = null;
    resetMapScreen();
    showAuthTab("login");
    clearLoginForm();
    appView.classList.add("hidden");
    authView.classList.remove("hidden");
}

function clearLoginForm() {
    loginForm.reset();
    loginForm.querySelectorAll("input").forEach((input) => {
        input.defaultValue = "";
        input.value = "";
    });
    showLoginEmailError(false);
}

function showAuthError(message) {
    authMessage.textContent = message;
    authMessage.className = "message error";
}

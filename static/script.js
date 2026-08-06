// --- Referencias a elementos del DOM ---
const btnConnect = document.getElementById("btn-connect");
const btnDisconnect = document.getElementById("btn-disconnect");
const btnMove = document.getElementById("btn-move");
const btnAck = document.getElementById("btn-ack");
const btnEnable = document.getElementById("btn-enable");
const btnRef = document.getElementById("btn-ref");

const connectionStatus = document.getElementById("connection-status");

let pollingInterval = null;

// --- Función auxiliar para peticiones POST con JSON ---
async function postJSON(url, body = {}) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return res.json();
}

// --- Conectar ---
btnConnect.addEventListener("click", async () => {
    connectionStatus.textContent = "Conectando...";
    connectionStatus.className = "status-indicator disconnected";

    const result = await postJSON("/api/connect");

    if (result.connected) {
        connectionStatus.textContent = "Conectado";
        connectionStatus.className = "status-indicator connected";
        startPolling();
    } else {
        connectionStatus.textContent = "Error de conexión";
        connectionStatus.className = "status-indicator disconnected";
        alert("Error al conectar: " + (result.error || "desconocido"));
    }
});

// --- Desconectar ---
btnDisconnect.addEventListener("click", async () => {
    await postJSON("/api/disconnect");
    connectionStatus.textContent = "Desconectado";
    connectionStatus.className = "status-indicator disconnected";
    stopPolling();
    clearStatusFields();
});

// --- Acknowledge Faults ---
btnAck.addEventListener("click", async () => {
    const result = await postJSON("/api/acknowledge_faults");
    if (!result.success) alert("Error al reconocer fallos: " + result.error);
});

// --- Enable Powerstage ---
btnEnable.addEventListener("click", async () => {
    const result = await postJSON("/api/enable_powerstage");
    if (!result.success) alert("Error al habilitar powerstage: " + result.error);
});

// --- Referencing ---
btnRef.addEventListener("click", async () => {
    const result = await postJSON("/api/referencing");
    if (!result.success) alert("Error en referencing: " + result.error);
});

// --- Mover a posición ---
btnMove.addEventListener("click", async () => {
    const position = parseFloat(document.getElementById("target-position").value);
    const velocity = parseFloat(document.getElementById("target-velocity").value);
    const absolute = document.getElementById("absolute-checkbox").checked;

    const result = await postJSON("/api/move", { position, velocity, absolute });
    if (!result.success) alert("Error al mover: " + result.error);
});

// --- Actualizar estado (polling) ---
async function updateStatus() {
    try {
        const res = await fetch("/api/status");
        const data = await res.json();

        if (data.connected && !data.error) {
            document.getElementById("actual-position").textContent = data.actual_position ?? "--";
            document.getElementById("actual-velocity").textContent = data.actual_velocity ?? "--";
            document.getElementById("ready-status").textContent = data.ready ? "Sí" : "No";
            document.getElementById("fault-status").textContent = data.fault ? "SÍ ⚠️" : "No";
        } else if (data.error) {
            console.warn("Error leyendo estado:", data.error);
        }
    } catch (e) {
        console.error("Error en polling de estado:", e);
    }
}

function startPolling() {
    if (pollingInterval) return; // evita duplicar intervalos
    pollingInterval = setInterval(updateStatus, 1000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

function clearStatusFields() {
    document.getElementById("actual-position").textContent = "--";
    document.getElementById("actual-velocity").textContent = "--";
    document.getElementById("ready-status").textContent = "--";
    document.getElementById("fault-status").textContent = "--";
}

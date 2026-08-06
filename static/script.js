const btnConnect = document.getElementById("btn-connect");
const btnMove = document.getElementById("btn-move");
const btnHome = document.getElementById("btn-home");
const btnReset = document.getElementById("btn-reset");
const btnStop = document.getElementById("btn-stop");

const connectionStatus = document.getElementById("connection-status");

async function postJSON(url, body = {}) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return res.json();
}

btnConnect.addEventListener("click", async () => {
    connectionStatus.textContent = "Conectando...";
    const result = await postJSON("/api/connect");
    if (result.connected) {
        connectionStatus.textContent = "Conectado";
        connectionStatus.className = "status-indicator connected";
        startPolling();
    } else {
        connectionStatus.textContent = "Error de conexión";
        connectionStatus.className = "status-indicator disconnected";
    }
});

btnMove.addEventListener("click", async () => {
    const position = parseFloat(document.getElementById("target-position").value);
    const velocity = parseFloat(document.getElementById("target-velocity").value);
    const result = await postJSON("/api/move", { position, velocity });
    if (!result.success) alert("Error al mover: " + result.error);
});

btnHome.addEventListener("click", async () => {
    const result = await postJSON("/api/home");
    if (!result.success) alert("Error en homing: " + result.error);
});

btnReset.addEventListener("click", async () => {
    const result = await postJSON("/api/reset");
    if (!result.success) alert("Error al resetear: " + result.error);
});

btnStop.addEventListener("click", async () => {
    const result = await postJSON("/api/stop");
    if (!result.success) alert("Error al parar: " + result.error);
});

async function updateStatus() {
    const res = await fetch("/api/status");
    const data = await res.json();
    if (data.connected) {
        document.getElementById("actual-position").textContent = data.actual_position ?? "--";
        document.getElementById("actual-velocity").textContent = data.actual_velocity ?? "--";
        document.getElementById("ready-status").textContent = data.ready ? "Sí" : "No";
        document.getElementById("fault-status").textContent = data.fault ? "SÍ ⚠️" : "No";
    }
}

function startPolling() {
    setInterval(updateStatus, 1000);
}

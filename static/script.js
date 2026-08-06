const btnConnect = document.getElementById("btn-connect");
const btnMove = document.getElementById("btn-move");
const btnAck = document.getElementById("btn-ack");
const btnEnable = document.getElementById("btn-enable");
const btnRef = document.getElementById("btn-ref");

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

btnAck.addEventListener("click", async () => {
    const result = await postJSON("/api/acknowledge_faults");
    if (!result.success) alert("Error: " + result.error);
});

btnEnable.addEventListener("click", async () => {
    const result = await postJSON("/api/enable_powerstage");
    if (!result.success) alert("Error: " + result.error);
});

btnRef.addEventListener("click", async () => {
    const result = await postJSON("/api/referencing");
    if (!result.success) alert("Error en referencing: " + result.error);
});

btnMove.addEventListener("click", async () => {
    const position = parseFloat(document.getElementById("target-position").value);
    const velocity = parseFloat(document.getElementById("target-velocity").value);
    const absolute = document.getElementById("absolute-checkbox").checked;
    const result = await postJSON("/api/move", { position, velocity, absolute });
    if (!result.success) alert("Error al mover: " + result.error);
});

async function updateStatus() {
    const res = await fetch("/api/status");
    const data = await res.json();
    if (data.connected && !data.error) {
        document.getElementById("actual-position").textContent = data.actual_position ?? "--";
        document.getElementById("actual-velocity").textContent = data.actual_velocity ?? "--";
        document.getElementById("ready-status").textContent = data.ready ? "Sí" : "No";
        document.getElementById("fault-status").textContent = data.fault ? "SÍ ⚠️" : "No";
    }
}

function startPolling() {
    setInterval(updateStatus, 1000);
}

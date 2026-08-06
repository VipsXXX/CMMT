from flask import Flask, render_template, jsonify, request
from edcon.profidrive.telegram111 import Telegram111
from edcon.edrive.com_ethercat import ComEtherCAT
from edcon.utils.logging import Logging

app = Flask(__name__)

# --- Configuración de conexión con la CMMT ---
DEVICE_IP = "192.168.0.1"

com = None
telegram = None
connected = False


def connect_device():
    """Establece la conexión EtherCAT con la CMMT y prepara el Telegrama 111."""
    global com, telegram, connected
    try:
        com = ComEtherCAT(DEVICE_IP)
        telegram = Telegram111(com)
        connected = True
        return True
    except Exception as e:
        Logging.logger.error(f"Error de conexión: {e}")
        connected = False
        return False


@app.route("/")
def index():
    return render_template("index.html", device_ip=DEVICE_IP)


@app.route("/api/connect", methods=["POST"])
def api_connect():
    ok = connect_device()
    return jsonify({"connected": ok})


@app.route("/api/status", methods=["GET"])
def api_status():
    if not connected:
        return jsonify({"connected": False})

    try:
        # NOTA: Verificar nombres exactos de atributos en festo-edcon 1.0.1
        status = {
            "connected": True,
            "actual_position": telegram.actual_position(),
            "actual_velocity": telegram.actual_velocity(),
            "fault": telegram.fault_present(),
            "ready": telegram.drive_ready(),
        }
        return jsonify(status)
    except Exception as e:
        return jsonify({"connected": True, "error": str(e)})


@app.route("/api/move", methods=["POST"])
def api_move():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})

    data = request.get_json()
    position = data.get("position")
    velocity = data.get("velocity", 100)

    try:
        # NOTA: Verificar la firma exacta del método de posicionamiento
        telegram.enable_operation()
        telegram.position_task(
            target_position=position,
            velocity=velocity
        )
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/stop", methods=["POST"])
def api_stop():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})
    try:
        telegram.quick_stop()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/home", methods=["POST"])
def api_home():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})
    try:
        telegram.homing()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/reset", methods=["POST"])
def api_reset():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})
    try:
        telegram.fault_reset()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

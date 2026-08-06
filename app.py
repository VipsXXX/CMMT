from flask import Flask, render_template, jsonify, request
from edcon.edrive.com_modbus import ComModbus
from edcon.edrive.motion_handler import MotionHandler
from edcon.utils.logging import Logging

Logging()

app = Flask(__name__)

DEVICE_IP = "192.168.0.1"

com = None
mot = None
connected = False


def connect_device():
    """Se ejecuta ÚNICAMENTE cuando el usuario pulsa 'Conectar'."""
    global com, mot, connected
    try:
        com = ComModbus(DEVICE_IP)
        mot = MotionHandler(com)
        mot.__enter__()
        connected = True
        return True, None
    except Exception as e:
        connected = False
        return False, str(e)


def disconnect_device():
    """Se ejecuta ÚNICAMENTE cuando el usuario pulsa 'Desconectar'."""
    global mot, com, connected
    if mot is not None:
        try:
            mot.__exit__(None, None, None)
        except Exception as e:
            Logging.logger.error(f"Error al desconectar: {e}")
    mot = None
    com = None
    connected = False


@app.route("/")
def index():
    return render_template("index.html", device_ip=DEVICE_IP)


@app.route("/api/connect", methods=["POST"])
def api_connect():
    ok, error = connect_device()
    return jsonify({"connected": ok, "error": error})


@app.route("/api/disconnect", methods=["POST"])
def api_disconnect():
    disconnect_device()
    return jsonify({"connected": False})


@app.route("/api/status", methods=["GET"])
def api_status():
    if not connected:
        return jsonify({"connected": False})
    try:
        status = {
            "connected": True,
            "actual_position": mot.telegram.actual_position(),
            "actual_velocity": mot.telegram.actual_velocity(),
            "fault": mot.telegram.fault_present(),
            "ready": mot.telegram.drive_ready(),
        }
        return jsonify(status)
    except Exception as e:
        return jsonify({"connected": True, "error": str(e)})


@app.route("/api/acknowledge_faults", methods=["POST"])
def api_acknowledge_faults():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})
    try:
        mot.acknowledge_faults()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/enable_powerstage", methods=["POST"])
def api_enable_powerstage():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})
    try:
        mot.enable_powerstage()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/referencing", methods=["POST"])
def api_referencing():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})
    try:
        mot.referencing_task()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/move", methods=["POST"])
def api_move():
    if not connected:
        return jsonify({"success": False, "error": "No conectado"})

    data = request.get_json()
    position = data.get("position")
    velocity = data.get("velocity", 100000)
    absolute = data.get("absolute", False)

    try:
        mot.position_task(position, velocity, absolute=absolute)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


if __name__ == "__main__":
    # use_reloader=False evita que Flask reinicie el proceso dos veces en debug,
    # lo cual sería confuso al tener conexiones activas con el hardware
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)

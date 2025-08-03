from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/summary', methods=['POST'])
def resumen():
    data = request.get_json()
    text = data.get('text', '')
    # TODO: Llama a modelo real
    resumen = text[:400] + "..." if len(text) > 400 else text
    return jsonify({"summary": resumen})

@app.route('/translate', methods=['POST'])
def traducir():
    data = request.get_json()
    text = data.get('text', '')
    to = data.get('to', 'en')
    # TODO: Integrar Google Translate, DeepL, etc.
    traduccion = text[::-1]  # Simula traducción invirtiendo texto
    return jsonify({"translated": traduccion, "to": to})

@app.route('/stats', methods=['POST'])
def stats():
    data = request.get_json()
    values = data.get('values', [])
    if not values:
        return jsonify({"error": "No hay datos"}), 400
    arr = np.array(values, dtype=np.float32)
    res = {
        "mean": float(np.mean(arr)),
        "std": float(np.std(arr)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr))
    }
    return jsonify(res)

@app.route('/animate', methods=['POST'])
def animate():
    # TODO: Implementa animación (devuelve gif/video)
    return jsonify({"url": "", "msg": "Animación no implementada aún."})

if __name__ == "__main__":
    app.run(port=5005, debug=True)

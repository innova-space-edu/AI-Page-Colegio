from flask import Flask, request, jsonify
import matplotlib.pyplot as plt
import numpy as np
import sympy as sp
import pandas as pd
from utils import image_to_base64
from io import BytesIO
import base64  # <-- necesario

app = Flask(__name__)

@app.route('/plot', methods=['POST'])
def plot():
    data = request.get_json()
    prompt = data.get('prompt', '').lower()
    x = np.linspace(-10, 10, 300)
    y = np.sin(x)
    title = "Gráfico de y = sin(x)"
    explanation = "Ejemplo. Pide otra función: 'Grafica y = x^2'."
    try:
        if "x^2" in prompt or "x²" in prompt:
            y = x ** 2
            title = "y = x²"
            explanation = "Parábola y = x²."
        elif "cos" in prompt:
            y = np.cos(x)
            title = "y = cos(x)"
            explanation = "Función coseno."
        elif "exp" in prompt or "e^x" in prompt:
            y = np.exp(x)
            title = "y = exp(x)"
            explanation = "Función exponencial."
        elif "log" in prompt:
            y = np.log(x[x > 0])
            x = x[x > 0]
            title = "y = log(x)"
            explanation = "Función logaritmo natural."
        elif "tan" in prompt:
            y = np.tan(x)
            title = "y = tan(x)"
            explanation = "Función tangente."
        # ¡Ahora más inteligencia con sympy!
        elif "y =" in prompt or "grafic" in prompt:
            eq = prompt.split('y =')[-1].strip()
            x_sp = sp.symbols('x')
            y_sp = sp.lambdify(x_sp, sp.sympify(eq))
            y = y_sp(x)
            title = f"y = {eq}"
            explanation = f"Gráfico automático de y = {eq}"
        plt.figure(figsize=(5, 3))
        plt.plot(x, y)
        plt.title(title)
        plt.xlabel("x")
        plt.ylabel("y")
        plt.grid(True)
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        img_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode()
    except Exception as e:
        img_b64 = ""
        explanation = f"Error: {str(e)}"
    return jsonify({"url": img_b64, "explanation": explanation})

@app.route('/histogram', methods=['POST'])
def histogram():
    data = request.get_json()
    values = data.get('values', [])
    if not values:
        text = data.get('text', '')
        try:
            # Buscar números en texto
            import re
            values = list(map(float, re.findall(r"[-+]?\d*\.\d+|\d+", text)))
        except:
            return jsonify({"url": "", "explanation": "No se pudo extraer datos."})
    try:
        plt.figure(figsize=(5, 3))
        plt.hist(values, bins='auto', color="#8e24aa", edgecolor="#fff")
        plt.title("Histograma de datos")
        plt.xlabel("Valor")
        plt.ylabel("Frecuencia")
        plt.grid(True)
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        img_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode()
        explanation = "Histograma generado."
    except Exception as e:
        img_b64 = ""
        explanation = f"Error: {str(e)}"
    return jsonify({"url": img_b64, "explanation": explanation})

@app.route('/bars', methods=['POST'])
def bars():
    data = request.get_json()
    values = data.get('values', [])
    labels = data.get('labels', [])
    if not values:
        return jsonify({"url": "", "explanation": "Debes enviar los valores."})
    try:
        plt.figure(figsize=(5, 3))
        plt.bar(labels if labels else range(len(values)), values, color="#1976d2")
        plt.title("Gráfico de barras")
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        img_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode()
        explanation = "Gráfico de barras generado."
    except Exception as e:
        img_b64 = ""
        explanation = f"Error: {str(e)}"
    return jsonify({"url": img_b64, "explanation": explanation})

@app.route('/pie', methods=['POST'])
def pie():
    data = request.get_json()
    values = data.get('values', [])
    labels = data.get('labels', [])
    if not values:
        return jsonify({"url": "", "explanation": "Debes enviar los valores."})
    try:
        plt.figure(figsize=(5, 3))
        plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=140)
        plt.title("Gráfico de torta (pie chart)")
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        img_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode()
        explanation = "Gráfico de torta generado."
    except Exception as e:
        img_b64 = ""
        explanation = f"Error: {str(e)}"
    return jsonify({"url": img_b64, "explanation": explanation})

@app.route('/solve', methods=['POST'])
def solve_equation():
    data = request.get_json()
    eq_str = data.get('equation', '')
    try:
        x = sp.symbols('x')
        eq = sp.sympify(eq_str)
        solutions = sp.solve(eq, x)
        explanation = f"La(s) solución(es) de {eq_str} son: {solutions}"
    except Exception as e:
        explanation = f"No se pudo resolver: {str(e)}"
    return jsonify({"solution": explanation})

if __name__ == "__main__":
    app.run(port=5000, debug=True)


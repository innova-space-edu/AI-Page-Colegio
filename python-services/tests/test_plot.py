import requests

resp = requests.post('http://localhost:5000/plot', json={"prompt": "Gráfica y = cos(x)"})
print(resp.json())

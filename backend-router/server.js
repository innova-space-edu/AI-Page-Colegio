import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { verifyFirebaseToken } from './auth.js';
import { saveChat, loadChat } from './chat_storage.js';
import {
  isImagePrompt, isPlotPrompt, isSummaryPrompt, isTranslatePrompt, isStatsPrompt, isAnimatePrompt,
  extractTable, detectTableInText
} from './utils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS permite Authorization header y múltiples orígenes
app.use(cors({
  origin: [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '25mb' })); // Para imágenes base64

app.use(verifyFirebaseToken);

app.post('/api/chat', async (req, res) => {
  console.log('🔔 /api/chat payload:', req.body);
  try {
    const { messages, imageBase64 } = req.body;
    const userId = req.userId;
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

    // 1. IMÁGENES: OCR, BLIP, etc.
    if (imageBase64) {
      let url = process.env.PYTHON_BLIP_URL || 'http://localhost:5002/blip';
      if (isImagePrompt(lastUserMsg)) url = process.env.PYTHON_OCR_URL || 'http://localhost:5001/ocr';

      const imgRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, prompt: lastUserMsg })
      });
      const imgData = await imgRes.json();
      const aiMsg = {
        role: 'assistant',
        content: imgData.description || imgData.text || 'Imagen procesada.',
        tags: imgData.tags || [],
        scene: imgData.scene || null,
        suggestions: [
          "¿Quieres analizar otra imagen?",
          "¿Te explico los pasos?",
          "¿Deseas guardar esta respuesta?"
        ]
      };
      await saveChat(userId, [...messages, aiMsg]);
      return res.json({
        choices: [{ message: aiMsg }],
        respuesta: aiMsg.content,
        tags: aiMsg.tags,
        suggestions: aiMsg.suggestions
      });
    }

    // 2. GRÁFICOS automáticos si detecta gráfico o tabla en texto o respuesta previa
    let extra = {};
    if (isPlotPrompt(lastUserMsg)) {
      const plotRes = await fetch(process.env.PYTHON_PLOT_URL || 'http://localhost:5000/plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMsg })
      });
      const plotData = await plotRes.json();
      extra.plot = plotData;
    }

    // TABLAS: Detecta y grafica automáticamente
    const tabla = detectTableInText(lastUserMsg);
    if (tabla) {
      const barsRes = await fetch(process.env.PYTHON_PLOT_URL?.replace('/plot','/bars') || 'http://localhost:5000/bars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tabla)
      });
      const barsData = await barsRes.json();
      extra.bars = barsData;
    }

    // 3. INTENCIÓN: resumen, traducción, stats, animación, etc.
    if (isSummaryPrompt(lastUserMsg)) {
      const summaryRes = await fetch(process.env.PYTHON_GLOBAL_URL || 'http://localhost:5005/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastUserMsg })
      });
      const summaryData = await summaryRes.json();
      extra.summary = summaryData.summary;
    }
    if (isTranslatePrompt(lastUserMsg)) {
      const translateRes = await fetch(process.env.PYTHON_GLOBAL_URL || 'http://localhost:5005/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastUserMsg, to: "en" }) // o detecta idioma destino
      });
      const translateData = await translateRes.json();
      extra.translation = translateData.translated;
    }
    if (isStatsPrompt(lastUserMsg) || tabla) {
      const statsRes = await fetch(process.env.PYTHON_GLOBAL_URL || 'http://localhost:5005/stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: tabla?.values || [] })
      });
      const statsData = await statsRes.json();
      extra.stats = statsData;
    }
    if (isAnimatePrompt(lastUserMsg)) {
      const animRes = await fetch(process.env.PYTHON_GLOBAL_URL || 'http://localhost:5005/animate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMsg })
      });
      const animData = await animRes.json();
      extra.animation = animData.url;
    }

    // 4. Decide el modelo: Qwen para fórmulas y cálculos, Llama 4 para todo lo demás
    let useQwen = /(fórmula|ecuación|gráfic|derivada|integral|resuelve|resolver|expresión|tabla|matriz|valor|estadística|desviación|promedio|media|función|explica.*fórmula)/i.test(lastUserMsg) || !!tabla;
    let modelUrl, headers, body;
    if (useQwen) {
      modelUrl = "https://api.endpointhf.com/v1/chat/completions";
      headers = {
        "Authorization": `Bearer ${process.env.QWEN_API_KEY}`,
        "Content-Type": "application/json"
      };
      body = { model: "Qwen/Qwen1.5-32B-Chat", messages, temperature: 0.7 };
    } else {
      modelUrl = "https://api.groq.com/openai/v1/chat/completions";
      headers = {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      };
      body = { model: "meta-llama/llama-4-scout-17b-16e-instruct", messages, temperature: 0.7 };
    }

    // PROMPT SUGERIDO PARA MEJOR FORMATO:
    body.system = `
      Si el usuario te pide una fórmula, derivada, tabla o gráfico, primero explica claro el concepto en español, luego da la fórmula o tabla en formato Markdown, y al final repite la fórmula en una línea como: y = ... para que el sistema la pueda graficar.
      Si piden un resumen, di: "Aquí tienes el resumen", y si piden traducir, entrega solo la traducción al final.
      Si hay una tabla de datos, da los valores y etiquetas claros, separados por punto y coma.
    `;

    // Consulta al modelo
    const modelRes = await fetch(modelUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const data = await modelRes.json();
    console.log('🔹 Model responde:', data);

    const content = data.choices?.[0]?.message?.content || 'Sin respuesta.';
    let suggestions = [
      "¿Quieres ver un ejemplo?",
      "¿Te gustaría intentarlo tú mismo?",
      "¿Necesitas una explicación gráfica?"
    ];
    const aiMsg = { role: 'assistant', content, suggestions, ...extra };

    await saveChat(userId, [...messages, aiMsg]);
    res.json({
      choices: [{ message: aiMsg }],
      respuesta: aiMsg.content,
      suggestions,
      ...extra
    });

  } catch (err) {
    console.error('❌ Error en /api/chat:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint historial
app.get('/api/history', async (req, res) => {
  try {
    const chat = await loadChat(req.userId);
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo cargar el historial.' });
  }
});

app.listen(PORT, () =>
  console.log(`✅ MIRA backend-router corriendo en http://localhost:${PORT}`)
);

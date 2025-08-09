import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { verifyFirebaseToken } from './auth.js';
import { saveChat, loadChat } from './chat_storage.js';
import {
  isImagePrompt,
  isPlotPrompt,
  isSummaryPrompt,
  isTranslatePrompt,
  isStatsPrompt,
  isAnimatePrompt,
  detectTableInText
} from './utils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS dinámico con lista blanca
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '25mb' })); // Soporta imágenes base64

// Endpoint de salud
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'backend-router' }));

// Protección con Firebase
app.use(verifyFirebaseToken);

// Endpoint principal de chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], imageBase64 } = req.body || {};
    const userId = req.userId || 'anonymous';
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const lastUserMsg = lastUser?.content?.trim() || '';
    let extra = {};

    // 1. Manejo de imágenes (OCR o BLIP)
    if (imageBase64) {
      const useOCR = isImagePrompt(lastUserMsg);
      const url = useOCR
        ? (process.env.PYTHON_OCR_URL || 'http://localhost:5001/ocr')
        : (process.env.PYTHON_BLIP_URL || 'http://localhost:5002/blip');
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, prompt: lastUserMsg })
      });
      const data = await resp.json();
      const aiMsg = {
        role: 'assistant',
        content: data.description || data.text || 'Imagen procesada.',
        tags: data.tags || [],
        scene: data.scene || null,
        suggestions: [
          '¿Quieres analizar otra imagen?',
          '¿Te explico los pasos?',
          '¿Deseas guardar esta respuesta?'
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

    // 2. Detección de gráficos
    if (isPlotPrompt(lastUserMsg)) {
      const plotRes = await fetch(process.env.PYTHON_PLOT_URL || 'http://localhost:5000/plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMsg })
      });
      extra.plot = await plotRes.json();
    }

    // Detección de tablas en texto
    const tabla = detectTableInText(lastUserMsg);
    if (tabla) {
      const barsUrl = (process.env.PYTHON_PLOT_URL || 'http://localhost:5000/plot').replace('/plot', '/bars');
      const barsRes = await fetch(barsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tabla)
      });
      extra.bars = await barsRes.json();
    }

    // 3. Tareas globales: resumen, traducción, estadísticas, animación
    const GLOBAL = process.env.PYTHON_GLOBAL_URL || 'http://localhost:5005';
    if (isSummaryPrompt(lastUserMsg)) {
      const resSum = await fetch(`${GLOBAL}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastUserMsg })
      });
      extra.summary = (await resSum.json()).summary;
    }
    if (isTranslatePrompt(lastUserMsg)) {
      const resTrans = await fetch(`${GLOBAL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastUserMsg, to: 'en' })
      });
      extra.translation = (await resTrans.json()).translated;
    }
    if (isStatsPrompt(lastUserMsg) || tabla) {
      const resStats = await fetch(`${GLOBAL}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: tabla?.values || [] })
      });
      extra.stats = await resStats.json();
    }
    if (isAnimatePrompt(lastUserMsg)) {
      const resAnim = await fetch(`${GLOBAL}/animate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lastUserMsg })
      });
      extra.animation = (await resAnim.json()).url;
    }

    // 4. Construir mensaje system y decidir modelo
    const systemMsg = {
      role: 'system',
      content: `
Eres MIRA (Innova Space). Responde en español de forma clara y estructurada.
Si te piden una fórmula, derivada, tabla o gráfico: primero explica el concepto; después proporciona la fórmula o tabla en formato Markdown/LaTeX; finalmente repite en una sola línea el formato "y = ..." si aplica para graficar.
Si te piden un resumen, empieza con "Aquí tienes el resumen:".
Si te piden traducir, termina la respuesta solo con el texto traducido.
Si hay una tabla de datos, entrega los valores y etiquetas claros, separados por punto y coma.
      `.trim()
    };
    const modelMessages = [systemMsg, ...messages];
    const wantsMath = /(fórmula|ecuación|gráfic|derivada|integral|resuelve|resolver|expresión|tabla|matriz|valor|estadística|desviación|promedio|media|función|explica.*fórmula)/i.test(lastUserMsg) || !!tabla;

    let modelUrl;
    let headers;
    let body;
    if (wantsMath && process.env.QWEN_API_KEY) {
      modelUrl = 'https://api.endpointhf.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      };
      body = { model: 'Qwen/Qwen1.5-32B-Chat', messages: modelMessages, temperature: 0.7 };
    } else {
      modelUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      };
      body = { model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages: modelMessages, temperature: 0.7 };
    }

    const modelRes = await fetch(modelUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await modelRes.json();
    const content = data.choices?.[0]?.message?.content || 'Sin respuesta.';

    const suggestions = [
      '¿Quieres ver un ejemplo?',
      '¿Te gustaría intentarlo tú mismo?',
      '¿Necesitas una explicación gráfica?'
    ];
    const aiMsg = { role: 'assistant', content, suggestions, ...extra };
    await saveChat(userId, [...messages, aiMsg]);

    return res.json({
      choices: [{ message: aiMsg }],
      respuesta: aiMsg.content,
      suggestions,
      ...extra
    });

  } catch (err) {
    console.error('Error en /api/chat:', err);
    return res.status(500).json({ error: { message: err.message || String(err) } });
  }
});

// Historial
app.get('/api/history', async (req, res) => {
  try {
    const chat = await loadChat(req.userId);
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo cargar el historial.' });
  }
});

app.listen(PORT, () => {
  console.log(`MIRA backend-router corriendo en http://localhost:${PORT}`);
});

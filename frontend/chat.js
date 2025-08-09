const API_URL = 'http://localhost:3001/api/chat';
let chatHistory = [];
let lastSuggestions = [];

/**
 * Crea un span seguro con texto (evita HTML injection).
 */
function safeSpan(text) {
  const span = document.createElement('span');
  span.textContent = text ?? '';
  return span;
}

/**
 * Renderiza el historial de chat, incluyendo imágenes, datos extra y sugerencias.
 */
function renderChat() {
  const chatArea = document.getElementById('chat-area');
  chatArea.innerHTML = '';

  chatHistory.forEach((msg, idx) => {
    const bubble = document.createElement('div');
    bubble.className = msg.role === 'user' ? 'msg-user' : 'msg-ia';
    bubble.appendChild(safeSpan(msg.content));
    chatArea.appendChild(bubble);

    if (msg.plot?.url) {
      const img = document.createElement('img');
      img.src = msg.plot.url;
      img.style.maxWidth = '340px';
      img.style.display = 'block';
      chatArea.appendChild(img);
      if (msg.plot.explanation) {
        const expl = document.createElement('div');
        expl.className = 'msg-ia';
        expl.textContent = msg.plot.explanation;
        chatArea.appendChild(expl);
      }
    }

    if (msg.bars?.url) {
      const img = document.createElement('img');
      img.src = msg.bars.url;
      img.style.maxWidth = '340px';
      img.style.display = 'block';
      chatArea.appendChild(img);
      if (msg.bars.explanation) {
        const expl = document.createElement('div');
        expl.className = 'msg-ia';
        expl.textContent = msg.bars.explanation;
        chatArea.appendChild(expl);
      }
    }

    if (msg.pie?.url) {
      const img = document.createElement('img');
      img.src = msg.pie.url;
      img.style.maxWidth = '340px';
      img.style.display = 'block';
      chatArea.appendChild(img);
      if (msg.pie.explanation) {
        const expl = document.createElement('div');
        expl.className = 'msg-ia';
        expl.textContent = msg.pie.explanation;
        chatArea.appendChild(expl);
      }
    }

    if (msg.summary) {
      const div = document.createElement('div');
      div.className = 'msg-ia';
      div.innerHTML = `<strong>Resumen:</strong> ${msg.summary}`;
      chatArea.appendChild(div);
    }

    if (msg.translation) {
      const div = document.createElement('div');
      div.className = 'msg-ia';
      div.innerHTML = `<strong>Traducción:</strong> ${msg.translation}`;
      chatArea.appendChild(div);
    }

    if (msg.stats) {
      const div = document.createElement('div');
      div.className = 'msg-ia';
      div.innerHTML = `<strong>Estadística:</strong> Media: ${msg.stats.mean}, Desviación: ${msg.stats.std}`;
      chatArea.appendChild(div);
    }

    if (msg.animation) {
      const anim = document.createElement('img');
      anim.src = msg.animation;
      anim.style.maxWidth = '320px';
      anim.style.display = 'block';
      chatArea.appendChild(anim);
    }

    // Sugerencias solo para la última respuesta de IA
    if (idx === chatHistory.length - 1 && msg.role === 'assistant' && lastSuggestions.length > 0) {
      const sugDiv = document.createElement('div');
      sugDiv.className = 'suggestions';
      lastSuggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'sug-btn';
        btn.innerText = text;
        btn.onclick = () => sendMessage(text);
        sugDiv.appendChild(btn);
      });
      chatArea.appendChild(sugDiv);
    }
  });

  chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * Envía un mensaje al backend y maneja la respuesta.
 */
async function sendMessage(optionalText) {
  const input = document.getElementById('user-input');
  const text = (optionalText || input.value).trim();
  if (!text) return;

  chatHistory.push({ role: 'user', content: text });
  input.value = '';
  lastSuggestions = [];
  renderChat();

  // Elimina posibles "Sin respuesta." antiguos
  chatHistory = chatHistory.filter(m => !(m.role === 'assistant' && m.content === 'Sin respuesta.'));

  // Prepara payload
  const payload = {
    messages: chatHistory.map(m => ({ role: m.role, content: m.content }))
  };

  // Adjunta imagen base64 si existe (dataset.imageBase64)
  const imgInput = document.getElementById('image-input');
  if (imgInput.dataset.imageBase64) {
    payload.imageBase64 = imgInput.dataset.imageBase64;
    delete imgInput.dataset.imageBase64;
  }

  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const idToken = await user.getIdToken();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.error) {
      const bubble = document.createElement('div');
      bubble.className = 'msg-ia';
      bubble.textContent = 'Error IA: ' + (data.error.message || JSON.stringify(data.error));
      document.getElementById('chat-area').appendChild(bubble);
      return;
    }

    lastSuggestions = data.suggestions || [];
    const aiContent =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      data.respuesta ||
      data.result ||
      'Sin respuesta.';

    if (aiContent !== 'Sin respuesta.') {
      const aiMsg = { role: 'assistant', content: aiContent };
      if (data.plot) aiMsg.plot = data.plot;
      if (data.bars) aiMsg.bars = data.bars;
      if (data.pie) aiMsg.pie = data.pie;
      if (data.summary) aiMsg.summary = data.summary;
      if (data.translation) aiMsg.translation = data.translation;
      if (data.stats) aiMsg.stats = data.stats;
      if (data.animation) aiMsg.animation = data.animation;
      chatHistory.push(aiMsg);
    }

    renderChat();
    speak(aiContent);
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    const bubble = document.createElement('div');
    bubble.className = 'msg-ia';
    bubble.textContent = 'No se pudo procesar la respuesta. Intenta nuevamente.';
    document.getElementById('chat-area').appendChild(bubble);
  }
}

// Listeners
document.getElementById('send-btn').addEventListener('click', () => sendMessage());
document.getElementById('user-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Sube imagen: convierte a DataURL y envía con el próximo mensaje
document.getElementById('image-input').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    e.target.dataset.imageBase64 = evt.target.result;
    sendMessage('(he subido una imagen)');
  };
  reader.readAsDataURL(file);
});

/**
 * TTS y animación del avatar al hablar.
 */
function speak(text) {
  if (!window.speechSynthesis) return;
  if (window.avatarSpeaking) window.avatarSpeaking();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-ES';
  window.speechSynthesis.speak(utter);
}

// Cargar historial local después de autenticarse
firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    const idToken = await user.getIdToken();
    localStorage.setItem('firebaseToken', idToken);
    const saved = localStorage.getItem('chat_' + user.uid);
    chatHistory = saved ? JSON.parse(saved) : [];
    chatHistory = chatHistory.filter(m => !(m.role === 'assistant' && m.content === 'Sin respuesta.'));
    lastSuggestions = [];
    renderChat();
  } else {
    window.location.href = 'login.html';
  }
});

// Guardar historial limpio al cerrar
window.addEventListener('beforeunload', () => {
  const user = firebase.auth().currentUser;
  if (user) {
    const cleanHistory = chatHistory.filter(m => !(m.role === 'assistant' && m.content === 'Sin respuesta.'));
    localStorage.setItem('chat_' + user.uid, JSON.stringify(cleanHistory));
  }
});

// Nuevo chat
document.getElementById('new-chat-btn').addEventListener('click', () => {
  chatHistory = [];
  lastSuggestions = [];
  renderChat();
});

// Utilidad de limpieza
window.clearAllStorage = function () {
  localStorage.clear();
  sessionStorage.clear();
  alert('¡Storage local limpiado!');
};

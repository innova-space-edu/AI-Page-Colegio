const API_URL = 'http://localhost:3001/api/chat';
let chatHistory = [];
let lastSuggestions = [];

/**
 * Renderiza el historial de chat y agrega elementos extras
 */
function renderChat() {
  const chatArea = document.getElementById('chat-area');
  chatArea.innerHTML = '';

  chatHistory.forEach((msg, idx) => {
    const bubble = document.createElement('div');
    bubble.className = msg.role === 'user' ? 'msg-user' : 'msg-ia';
    bubble.innerHTML = `<span>${msg.content || ''}</span>`;
    chatArea.appendChild(bubble);

    if (msg.plot && msg.plot.url) {
      const img = document.createElement('img');
      img.src = msg.plot.url;
      img.setAttribute('data-plot', '1');
      img.style.maxWidth = "340px";
      img.style.display = "block";
      chatArea.appendChild(img);
      if (msg.plot.explanation) {
        const expl = document.createElement('div');
        expl.className = "msg-ia";
        expl.innerText = msg.plot.explanation;
        chatArea.appendChild(expl);
      }
    }
    if (msg.bars && msg.bars.url) {
      const img = document.createElement('img');
      img.src = msg.bars.url;
      img.setAttribute('data-bars', '1');
      img.style.maxWidth = "340px";
      img.style.display = "block";
      chatArea.appendChild(img);
      if (msg.bars.explanation) {
        const expl = document.createElement('div');
        expl.className = "msg-ia";
        expl.innerText = msg.bars.explanation;
        chatArea.appendChild(expl);
      }
    }
    if (msg.pie && msg.pie.url) {
      const img = document.createElement('img');
      img.src = msg.pie.url;
      img.setAttribute('data-pie', '1');
      img.style.maxWidth = "340px";
      img.style.display = "block";
      chatArea.appendChild(img);
      if (msg.pie.explanation) {
        const expl = document.createElement('div');
        expl.className = "msg-ia";
        expl.innerText = msg.pie.explanation;
        chatArea.appendChild(expl);
      }
    }
    if (msg.summary) {
      const div = document.createElement('div');
      div.className = "msg-ia";
      div.innerHTML = `<strong>Resumen:</strong> ${msg.summary}`;
      chatArea.appendChild(div);
    }
    if (msg.translation) {
      const div = document.createElement('div');
      div.className = "msg-ia";
      div.innerHTML = `<strong>Traducción:</strong> ${msg.translation}`;
      chatArea.appendChild(div);
    }
    if (msg.stats) {
      const div = document.createElement('div');
      div.className = "msg-ia";
      div.innerHTML = `<strong>Estadística:</strong> Media: ${msg.stats.mean}, Desviación: ${msg.stats.std}`;
      chatArea.appendChild(div);
    }
    if (msg.animation) {
      const anim = document.createElement('img');
      anim.src = msg.animation;
      anim.style.maxWidth = "320px";
      anim.style.display = "block";
      chatArea.appendChild(anim);
    }

    // SOLO la última respuesta IA muestra sugerencias (pero no las guarda en chatHistory)
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
 * Envia mensaje al backend, filtra historial y maneja respuestas
 */
async function sendMessage(optionalText) {
  const input = document.getElementById('user-input');
  const text = (optionalText || input.value).trim();
  if (!text) return;

  chatHistory.push({ role: 'user', content: text });
  input.value = '';
  lastSuggestions = [];
  renderChat();

  // SIEMPRE filtra las "Sin respuesta" antes de enviar
  chatHistory = chatHistory.filter(
    msg => !(msg.role === 'assistant' && msg.content === 'Sin respuesta.')
  );

  const payload = {
    messages: chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  };
  const imgInput = document.getElementById('image-input');
  if (imgInput.dataset.uploadedUrl) {
    payload.imageUrl = imgInput.dataset.uploadedUrl;
    delete imgInput.dataset.uploadedUrl;
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

    console.log("Respuesta backend:", data);

    if (data.error) {
      const bubble = document.createElement('div');
      bubble.className = 'msg-ia';
      bubble.innerText = "Error IA: " + (data.error.message || JSON.stringify(data.error));
      document.getElementById('chat-area').appendChild(bubble);
      return;
    }

    lastSuggestions = data.suggestions || [];

    let aiContent =
      data.choices?.[0]?.message?.content
      || data.choices?.[0]?.text
      || data.respuesta
      || data.result
      || 'Sin respuesta.';

    // SOLO guarda respuestas REALES, no "Sin respuesta."
    if (aiContent !== 'Sin respuesta.') {
      const aiMsg = {
        role: 'assistant',
        content: aiContent
      };
      if (data.plot) aiMsg.plot = data.plot;
      if (data.bars) aiMsg.bars = data.bars;
      if (data.pie)  aiMsg.pie  = data.pie;
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
    bubble.innerText = "No se pudo procesar la respuesta. Intenta nuevamente.";
    document.getElementById('chat-area').appendChild(bubble);
  }
}

// Envío con botón
document.getElementById('send-btn')
  .addEventListener('click', () => sendMessage());

// Envío con Enter
document.getElementById('user-input')
  .addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

// Subida de imágenes
document.getElementById('image-input')
  .addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      firebase.auth().currentUser.getIdToken().then(idToken => {
        fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${idToken}` },
          body: new Blob([evt.target.result], { type: file.type })
        })
        .then(res => res.json())
        .then(json => {
          e.target.dataset.uploadedUrl = json.url;
          sendMessage();
        })
        .catch(err => console.error('Error subiendo imagen:', err));
      });
    };
    reader.readAsArrayBuffer(file);
  });

/**
 * Text-to-speech para la respuesta de la IA y animación de avatar
 */
function speak(text) {
  if (!window.speechSynthesis) return;
  if (window.avatarSpeaking) window.avatarSpeaking();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-ES';
  window.speechSynthesis.speak(utter);
}

// Carga historial local cuando el usuario ya está autenticado
firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    const idToken = await user.getIdToken();
    localStorage.setItem('firebaseToken', idToken);

    // Filtra respuestas basura al cargar historial
    const saved = localStorage.getItem('chat_' + user.uid);
    chatHistory = saved ? JSON.parse(saved) : [];
    chatHistory = chatHistory.filter(
      msg => !(msg.role === 'assistant' && msg.content === 'Sin respuesta.')
    );
    lastSuggestions = [];
    renderChat();
  } else {
    window.location.href = 'login.html';
  }
});

// Guarda historial al cerrar pestaña
window.addEventListener('beforeunload', () => {
  const user = firebase.auth().currentUser;
  if (user) {
    // Solo guarda historial limpio
    const cleanHistory = chatHistory.filter(
      msg => !(msg.role === 'assistant' && msg.content === 'Sin respuesta.')
    );
    localStorage.setItem('chat_' + user.uid, JSON.stringify(cleanHistory));
  }
});

// NUEVO CHAT
document.getElementById('new-chat-btn').addEventListener('click', () => {
  chatHistory = [];
  lastSuggestions = [];
  renderChat();
});

/**
 * Utilidad para limpiar todo el almacenamiento local (solo para desarrollo)
 * Ejecuta en consola: clearAllStorage();
 */
window.clearAllStorage = function () {
  localStorage.clear();
  sessionStorage.clear();
  alert('¡Storage local limpiado!');
};

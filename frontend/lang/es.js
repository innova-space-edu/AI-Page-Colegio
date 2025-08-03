// .js
let chatHistory = [];

function renderChat() {
  const chatArea = document.getElementById('chat-area');
  chatArea.innerHTML = '';
  chatHistory.forEach(msg => {
    const div = document.createElement('div');
    div.className = msg.role === 'user' ? 'msg-user' : 'msg-ia';
    div.innerHTML = `<span>${msg.content}</span>`;
    chatArea.appendChild(div);
    if (msg.suggestions) {
      const sugDiv = document.createElement('div');
      sugDiv.className = 'suggestions';
      msg.suggestions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'sug-btn';
        btn.innerText = s;
        btn.onclick = () => sendMessage(s);
        sugDiv.appendChild(btn);
      });
      chatArea.appendChild(sugDiv);
    }
  });
  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage(optionalText) {
  const input = document.getElementById('user-input');
  const text = (optionalText || input.value).trim();
  if (!text) return;
  chatHistory.push({ role: 'user', content: text });
  input.value = '';
  renderChat();
  // Aquí llamas a tu backend-router real:
  fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: chatHistory })
  })
    .then(res => res.json())
    .then(data => {
      const content = data.choices?.[0]?.message?.content || 'Sin respuesta.';
      let suggestions = [];
      // Si tu backend te retorna sugerencias, asígnalas aquí:
      if (data.suggestions) suggestions = data.suggestions;
      chatHistory.push({ role: 'assistant', content, suggestions });
      renderChat();
      speak(content);
    });
}

document.getElementById('send-btn').addEventListener('click', () => sendMessage());
document.getElementById('user-input').addEventListener('keydown', e => {
  if (e.key === "Enter") sendMessage();
});

// Sube imagen
document.getElementById('image-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: evt.target.result, messages: chatHistory })
    })
      .then(res => res.json())
      .then(data => {
        const content = data.choices?.[0]?.message?.content || 'Sin respuesta.';
        chatHistory.push({ role: 'assistant', content });
        renderChat();
        speak(content);
      });
  };
  reader.readAsDataURL(file);
});

// Voz
function speak(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  window.speechSynthesis.speak(utter);
}

// Carga historial local por usuario (simple, puedes mejorar luego)
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const saved = localStorage.getItem('chat_' + user.uid);
    chatHistory = saved ? JSON.parse(saved) : [];
    renderChat();
  }
});

window.addEventListener('beforeunload', () => {
  const user = firebase.auth().currentUser;
  if (user) {
    localStorage.setItem('chat_' + user.uid, JSON.stringify(chatHistory));
  }
});

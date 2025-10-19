import React, { useState } from 'react';

/**
 * Componente de chatbot (Mira) que funciona como ventana emergente.
 * Incluye una simple lógica de conversación simulada para fines
 * demostrativos. En una implementación real este componente debería
 * conectarse a un backend de IA (por ejemplo, mediante OpenAI API
 * u otros servicios) para ofrecer respuestas inteligentes. Sólo está
 * disponible para docentes.
 */
export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: '¡Hola! Soy Mira, tu asistente IA. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { id: Date.now(), type: 'user', text: input.trim() };
    // Para demostración se responde de manera predefinida
    const botReply = {
      id: Date.now() + 1,
      type: 'bot',
      text: 'Esta es una respuesta de ejemplo. Integra tu propia IA para respuestas reales.'
    };
    setMessages([...messages, userMessage, botReply]);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-secondary bg-opacity-90 backdrop-blur-md w-80 rounded-2xl shadow-xl flex flex-col text-white" style={{ zIndex: 1000 }}>
      <div className="flex justify-between items-center px-4 py-2 border-b border-highlight">
        <h3 className="font-bold">Mira - Asistente AI</h3>
        <button onClick={onClose} className="text-xl" title="Cerrar">\u2715</button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-2" style={{ maxHeight: '300px' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span
              className={`inline-block max-w-[70%] px-3 py-2 rounded-lg ${msg.type === 'user' ? 'bg-accent text-primary' : 'bg-highlight text-white'}`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-2 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-l-lg px-3 py-2 bg-primary border border-highlight text-white focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-primary rounded-r-lg font-semibold"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

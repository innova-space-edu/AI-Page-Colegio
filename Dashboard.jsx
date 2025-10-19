import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatBot from '../components/ChatBot';

/**
 * Panel principal tras el inicio de sesión. Muestra un resumen y
 * enlaces a las distintas asignaturas disponibles. El chatbot se
 * presenta como una ventana emergente que aparece con un clic y está
 * orientado a docentes para brindar asistencia contextual. El diseño
 * utiliza tarjetas redondeadas y colores llamativos para reforzar la
 * identidad futurista de la plataforma.
 */
export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-primary text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 p-8 relative overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="mt-4 sm:mt-0 px-4 py-2 bg-accent text-primary rounded-full hover:opacity-90"
          >
            {chatOpen ? 'Cerrar Mira' : 'Abrir Mira'}
          </button>
        </header>
        <section className="mb-8">
          <p className="mb-2 opacity-80">
            Bienvenido a <strong>Innova Space Education</strong>, plataforma de evaluación creada con IA. Selecciona una asignatura para crear o administrar pruebas.
          </p>
          <p className="text-sm opacity-60">
            Nota: El asistente Mira sólo está habilitado para docentes.
          </p>
        </section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/matematicas"
            className="block p-6 bg-secondary rounded-2xl shadow-lg hover:bg-highlight transition"
          >
            <h2 className="text-xl font-semibold mb-2">Matemáticas</h2>
            <p className="opacity-80 text-sm">
              Crear y gestionar pruebas de Matemáticas con evaluación automática mediante IA.
            </p>
          </Link>
          {/* Futuras asignaturas podrán agregarse aquí */}
        </div>
        {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
      </div>
    </div>
  );
}
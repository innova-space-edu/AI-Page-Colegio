import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

/**
 * Página de inicio de la plataforma. Presenta un formulario de
 * autenticación simplificado y un fondo animado que remarca la
 * naturaleza futurista y basada en IA de la aplicación. Al iniciar
 * sesión se almacena el correo del usuario en localStorage y se
 * redirige al panel principal. Esta página sirve como acceso tanto
 * para docentes como para estudiantes, aunque algunas funciones (como
 * el chatbot) solo estarán disponibles para docentes.
 */
export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem('user', email);
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center bg-primary text-white">
      {/* Capa de fondo animada */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-br from-highlight via-accent to-secondary rounded-full opacity-50 blur-3xl"></div>
      </motion.div>
      <div className="relative z-10 w-full max-w-md p-8 bg-secondary bg-opacity-80 rounded-3xl shadow-xl backdrop-blur-lg">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Innova Space Education" className="w-24 h-24 rounded-full shadow-lg" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">Innova Space Education</h1>
        <p className="text-center text-sm mb-6 opacity-70">
          Plataforma de evaluaciones online potenciada por IA
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl p-3 bg-primary bg-opacity-60 border border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl p-3 bg-primary bg-opacity-60 border border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-accent text-primary font-bold hover:opacity-90 transition"
          >
            Ingresar
          </button>
        </form>
        <p className="text-xs text-center mt-4 opacity-60">
          Fundador: Dr. Esthefano Morales Campaña
        </p>
        <p className="text-xs text-center opacity-50">
          Contacto: contacto@innova-space-edu.cl
        </p>
      </div>
    </div>
  );
}
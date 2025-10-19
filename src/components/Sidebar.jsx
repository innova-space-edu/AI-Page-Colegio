import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * Componente de barra lateral para navegación. Puede expandirse y
 * contraerse y contiene enlaces a las secciones principales de la
 * aplicación. Incluye un botón para cerrar sesión que elimina la
 * sesión simulada guardada en localStorage.
 */
export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div
      className={`bg-secondary text-white transition-all duration-500 shadow-lg ${open ? 'w-64' : 'w-16'} h-screen flex flex-col`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="self-end p-2 focus:outline-none text-xl"
        title={open ? 'Contraer menú' : 'Expandir menú'}
      >
        {open ? '\u2715' : '\u2630'}
      </button>
      <nav className="flex-1 mt-4 space-y-2">
        <Link
          to="/dashboard"
          className={`block px-4 py-2 rounded-lg hover:bg-highlight ${isActive('/dashboard') ? 'bg-highlight' : ''}`}
        >
          {open ? 'Inicio' : '🏠'}
        </Link>
        <Link
          to="/matematicas"
          className={`block px-4 py-2 rounded-lg hover:bg-highlight ${isActive('/matematicas') && !location.pathname.includes('/test') ? 'bg-highlight' : ''}`}
        >
          {open ? 'Matemáticas' : '∑'}
        </Link>
        {/* Puedes agregar enlaces a más asignaturas aquí */}
      </nav>
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full py-2 rounded-lg bg-accent text-primary hover:opacity-90"
        >
          {open ? 'Cerrar sesión' : '⎋'}
        </button>
      </div>
    </div>
  );
}

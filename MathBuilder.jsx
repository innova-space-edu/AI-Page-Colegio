import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/**
 * Página de creación de pruebas de Matemáticas.
 * Permite a los docentes definir la plantilla de una prueba: título, curso,
 * objetivo de aprendizaje e items. Cada item puede ser de tipo
 * selección múltiple, verdadero/falso o desarrollo con dibujo. Los
 * profesores pueden agregar o eliminar items, editar preguntas y
 * establecer las respuestas correctas para las opciones cerradas. Al
 * guardar la prueba se genera un identificador único y se almacena
 * localmente para demostración, permitiendo compartir un enlace con
 * los estudiantes.
 */
export default function MathBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [objective, setObjective] = useState('');
  const [items, setItems] = useState([]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        type: 'multipleChoice',
        question: '',
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correctIndex: 0
      }
    ]);
  };

  const updateItem = (index, updated) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updated };
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSave = () => {
    if (!title || items.length === 0) {
      alert('Debe ingresar un título y al menos un item.');
      return;
    }
    const id = Date.now().toString();
    const test = {
      id,
      title,
      course,
      objective,
      items
    };
    // Guardar en localStorage (demo); en un proyecto real se enviaría al servidor
    localStorage.setItem(`test-${id}`, JSON.stringify(test));
    alert('Prueba guardada correctamente.');
    // Mostrar link al usuario
    const link = `${window.location.origin}/matematicas/test/${id}`;
    prompt('Enlace para compartir con estudiantes:', link);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-primary text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Crear Prueba de Matemáticas</h1>
        <div className="space-y-4 max-w-3xl">
          <div>
            <label className="block mb-1">Título de la prueba</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl p-3 bg-secondary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          <div>
            <label className="block mb-1">Curso / Nivel</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full rounded-xl p-3 bg-secondary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          <div>
            <label className="block mb-1">Objetivo de aprendizaje</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full rounded-xl p-3 bg-secondary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
              rows="2"
            />
          </div>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Items</h2>
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 bg-secondary rounded-2xl shadow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Item {index + 1}</h3>
                <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-200">Eliminar</button>
              </div>
              <div className="mb-2">
                <label className="block mb-1">Pregunta</label>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => updateItem(index, { question: e.target.value })}
                  className="w-full rounded-xl p-3 bg-primary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Tipo de pregunta</label>
                <select
                  value={item.type}
                  onChange={(e) => updateItem(index, { type: e.target.value })}
                  className="w-full rounded-xl p-3 bg-primary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
                >
                  <option value="multipleChoice">Selección múltiple</option>
                  <option value="trueFalse">Verdadero o falso</option>
                  <option value="development">Desarrollo (con dibujo)</option>
                </select>
              </div>
              {item.type === 'multipleChoice' && (
                <div className="space-y-2">
                  {item.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center">
                      <input
                        type="radio"
                        name={`correct-${item.id}`}
                        checked={item.correctIndex === optIndex}
                        onChange={() => updateItem(index, { correctIndex: optIndex })}
                        className="mr-2 accent-highlight"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...item.options];
                          newOpts[optIndex] = e.target.value;
                          updateItem(index, { options: newOpts });
                        }}
                        className="flex-1 rounded-xl p-2 bg-primary border border-highlight mr-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                      />
                      <button
                        onClick={() => {
                          const newOpts = item.options.filter((_, i) => i !== optIndex);
                          updateItem(index, { options: newOpts, correctIndex: 0 });
                        }}
                        className="text-red-300 hover:text-red-100"
                        title="Eliminar opción"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      updateItem(index, { options: [...item.options, `Opción ${String.fromCharCode(65 + item.options.length)}`] });
                    }}
                    className="mt-2 px-3 py-2 bg-primary rounded-xl hover:bg-highlight"
                  >Agregar opción</button>
                </div>
              )}
              {item.type === 'trueFalse' && (
                <div className="mt-2">
                  <label className="block mb-1">Respuesta correcta</label>
                  <select
                    value={item.correctIndex === 1 ? 'true' : 'false'}
                    onChange={(e) => updateItem(index, { correctIndex: e.target.value === 'true' ? 1 : 0, options: ['Falso', 'Verdadero'] })}
                    className="w-full rounded-xl p-3 bg-primary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
                  >
                    <option value="true">Verdadero</option>
                    <option value="false">Falso</option>
                  </select>
                </div>
              )}
              {item.type === 'development' && (
                <p className="mt-2 text-sm opacity-70">La corrección de este ítem se realizará mediante IA.</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          <button onClick={addItem} className="px-4 py-3 rounded-xl bg-highlight hover:bg-accent text-white">Agregar ítem</button>
          <button onClick={handleSave} className="px-4 py-3 rounded-xl bg-accent text-primary hover:opacity-90">Guardar prueba</button>
        </div>
      </div>
    </div>
  );
}
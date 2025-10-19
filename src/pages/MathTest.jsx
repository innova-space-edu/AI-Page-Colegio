import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CanvasEditor from '../components/CanvasEditor';
import Sidebar from '../components/Sidebar';

/**
 * Página para que los estudiantes resuelvan una prueba de matemáticas.
 * La prueba se recupera desde localStorage utilizando el id de la URL.
 * Los estudiantes ingresan su nombre y curso, responden cada item y
 * finalmente envían sus respuestas. Para los ítems de desarrollo se
 * incorpora un lienzo basado en Fabric.js para dibujar y escribir. La
 * evaluación utiliza una lógica simple local que compara respuestas
 * cerradas con las soluciones y asigna un puntaje aleatorio a los
 * ítems de desarrollo como demostración. En un entorno de producción
 * este método debería invocar el servicio de IA para evaluar las
 * respuestas libres.
 */
export default function MathTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentCourse, setStudentCourse] = useState('');
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(`test-${id}`);
    if (stored) {
      setTest(JSON.parse(stored));
    }
  }, [id]);

  const handleOptionChange = (itemIndex, value) => {
    setResponses({ ...responses, [itemIndex]: value });
  };

  const handleExportDrawing = (itemIndex, imageData) => {
    setResponses({ ...responses, [itemIndex]: imageData });
  };

  const evaluate = async () => {
    if (!test) return;
    const scores = [];
    for (let i = 0; i < test.items.length; i++) {
      const item = test.items[i];
      const resp = responses[i];
      if (item.type === 'multipleChoice' || item.type === 'trueFalse') {
        const correct = item.type === 'trueFalse' ? item.correctIndex === 1 : item.correctIndex;
        scores.push({
          id: item.id,
          correct: resp == correct,
          item
        });
      } else if (item.type === 'development') {
        // En una implementación real, aquí se enviaría la imagen
        // y el enunciado a un servicio de IA para evaluación.
        // La respuesta dummy asigna puntuación aleatoria 0/1
        const randomScore = Math.random() > 0.5;
        scores.push({ id: item.id, correct: randomScore, item });
      }
    }
    setResults(scores);
    setSubmitted(true);
  };

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-white">
        <p>No se encontró la prueba solicitada.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-accent text-primary rounded-xl">Volver</button>
      </div>
    );
  }

  // Después de enviar, mostrar resultados
  if (submitted) {
    const correctCount = results.filter(r => r.correct).length;
    return (
      <div className="min-h-screen flex flex-col bg-primary text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Resultados de la prueba</h1>
        <p className="mb-4">Estudiante: {studentName}</p>
        <p className="mb-6">Puntaje: {correctCount} / {test.items.length}</p>
        <div className="space-y-4">
          {results.map((res, index) => (
            <div key={res.id} className="p-4 bg-secondary rounded-2xl">
              <p className="font-semibold mb-2">Item {index + 1}: {res.item.question}</p>
              <p className={res.correct ? 'text-green-400' : 'text-red-400'}>
                {res.correct ? 'Correcto' : 'Incorrecto'}
              </p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')} className="mt-8 px-4 py-3 bg-accent text-primary rounded-xl">Volver al panel</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-primary text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-4">{test.title}</h1>
        <p className="mb-6">{test.objective}</p>
        <div className="space-y-4 max-w-3xl">
          <div>
            <label className="block mb-1">Nombre del estudiante</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-xl p-3 bg-secondary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          <div>
            <label className="block mb-1">Curso</label>
            <input
              type="text"
              value={studentCourse}
              onChange={(e) => setStudentCourse(e.target.value)}
              className="w-full rounded-xl p-3 bg-secondary border border-highlight focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Preguntas</h2>
        <div className="space-y-8">
          {test.items.map((item, index) => (
            <div key={item.id} className="p-4 bg-secondary rounded-2xl">
              <h3 className="font-semibold mb-2">Item {index + 1}</h3>
              <p className="mb-4">{item.question}</p>
              {item.type === 'multipleChoice' && (
                <div className="space-y-2">
                  {item.options.map((opt, optIndex) => (
                    <label key={optIndex} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`resp-${index}`}
                        value={optIndex}
                        checked={responses[index] == optIndex}
                        onChange={() => handleOptionChange(index, optIndex)}
                        className="mr-2 accent-highlight"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {item.type === 'trueFalse' && (
                <div className="space-y-2">
                  {['Falso', 'Verdadero'].map((opt, optIndex) => (
                    <label key={optIndex} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`resp-${index}`}
                        value={optIndex}
                        checked={responses[index] == optIndex}
                        onChange={() => handleOptionChange(index, optIndex)}
                        className="mr-2 accent-highlight"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {item.type === 'development' && (
                <div>
                  <p className="mb-2 text-sm opacity-70">Dibuja o escribe tu respuesta a continuación:</p>
                  <CanvasEditor onExport={(dataUrl) => handleExportDrawing(index, dataUrl)} />
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={evaluate}
          className="mt-8 px-6 py-3 rounded-xl bg-accent text-primary font-bold hover:opacity-90"
        >Enviar respuestas</button>
      </div>
    </div>
  );
}

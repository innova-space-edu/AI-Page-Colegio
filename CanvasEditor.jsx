import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';

/**
 * Componente de lienzo interactivo basado en Fabric.js. Permite dibujar,
 * borrar, añadir texto y exportar el contenido a una imagen PNG. El
 * panel de herramientas se sitúa en la parte inferior, con un diseño
 * compacto ideal para uso en tabletas. El componente comunica la
 * imagen generada al componente padre mediante la prop onExport.
 */
export default function CanvasEditor({ width = 800, height = 400, onExport }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [color, setColor] = useState('#00ffc3');
  const [brushSize, setBrushSize] = useState(3);
  const [mode, setMode] = useState('draw');

  useEffect(() => {
    const c = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width,
      height,
      backgroundColor: '#0f0f1b'
    });
    c.freeDrawingBrush.color = color;
    c.freeDrawingBrush.width = brushSize;
    setCanvas(c);
    return () => c.dispose();
  }, [width, height]);

  useEffect(() => {
    if (!canvas) return;
    // Establecer modo de dibujo
    canvas.isDrawingMode = true;
    if (mode === 'erase') {
      // Borrador: usar color del fondo
      canvas.freeDrawingBrush.color = '#0f0f1b';
    } else {
      canvas.freeDrawingBrush.color = color;
    }
    canvas.freeDrawingBrush.width = brushSize;
  }, [canvas, color, brushSize, mode]);

  const addText = () => {
    if (!canvas) return;
    const textbox = new fabric.Textbox('Texto', {
      left: 50,
      top: 50,
      fill: color,
      fontSize: 20
    });
    canvas.add(textbox);
  };

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#0f0f1b';
  };

  const undo = () => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    if (objects.length > 0) {
      canvas.remove(objects[objects.length - 1]);
    }
  };

  const exportImage = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
    if (onExport) {
      onExport(dataURL);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <canvas ref={canvasRef} className="border-t border-l border-r border-highlight rounded-t-2xl" />
      <div className="flex flex-wrap items-center p-2 bg-secondary rounded-b-2xl">
        <button
          onClick={() => setMode('draw')}
          className={`px-3 py-2 m-1 rounded-lg ${mode === 'draw' ? 'bg-highlight' : 'bg-primary'}`}
        >
          Pluma
        </button>
        <button
          onClick={() => setMode('erase')}
          className={`px-3 py-2 m-1 rounded-lg ${mode === 'erase' ? 'bg-highlight' : 'bg-primary'}`}
        >
          Borrar
        </button>
        <button onClick={addText} className="px-3 py-2 m-1 rounded-lg bg-primary">Texto</button>
        <label className="flex items-center m-1">
          <span className="mr-1">Color</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 p-0 border-none cursor-pointer"
          />
        </label>
        <label className="flex items-center m-1">
          <span className="mr-1">Grosor</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="cursor-pointer"
          />
        </label>
        <button onClick={undo} className="px-3 py-2 m-1 rounded-lg bg-primary">Deshacer</button>
        <button onClick={clearCanvas} className="px-3 py-2 m-1 rounded-lg bg-primary">Limpiar</button>
        <button onClick={exportImage} className="px-3 py-2 m-1 rounded-lg bg-accent text-primary">Exportar</button>
      </div>
    </div>
  );
}
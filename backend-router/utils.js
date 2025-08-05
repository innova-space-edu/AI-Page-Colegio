// Detecta si el prompt es para OCR/imagen
export function isImagePrompt(text = "") {
  return /(leer|extraer|ocr|texto de la imagen|escanea|escanear)/i.test(text);
}

// Detecta si el prompt pide un gráfico/función matemática
export function isPlotPrompt(text = "") {
  return /(grafica|gráfico|plot|dibujar|matplotlib|función|curva|diagrama|haz una gráfica)/i.test(text);
}

// Detecta si el usuario pide un resumen
export function isSummaryPrompt(text = "") {
  return /(resumen|resume|sintetiza|síntesis|resumido)/i.test(text);
}

// Detecta si pide traducción
export function isTranslatePrompt(text = "") {
  return /(traduce|al inglés|en inglés|en español|al alemán|traducción|translate)/i.test(text);
}

// Detecta si pide estadísticas o histogramas
export function isStatsPrompt(text = "") {
  return /(media|promedio|desviación|varianza|mediana|moda|histograma|estadística|estadísticas|summary statistics)/i.test(text);
}

// Detecta si el usuario pide una animación/gif
export function isAnimatePrompt(text = "") {
  return /(anima|animación|gif|genera animación|haz una animación|haz un gif)/i.test(text);
}

// Detecta tablas simples (datos en filas separadas por saltos de línea y columnas por , o ;)
export function detectTableInText(text = "") {
  if (!text) return null;
  // Busca mínimo dos filas con ; o ,
  const rows = text.trim().split('\n').filter(r => /[,;]/.test(r));
  if (rows.length < 2) return null;
  // Normaliza a array de arrays
  const table = rows.map(row =>
    row.split(/[;,]/).map(c => c.trim())
  );
  // Intenta detectar si son etiquetas + valores
  const labels = table[0];
  const valuesRows = table.slice(1);

  // Si solo dos columnas, y todos numéricos salvo encabezado
  if (labels.length === 2 && valuesRows.every(r => r.length === 2)) {
    const isNumeric = valuesRows.every(r => !isNaN(Number(r[1])));
    if (isNumeric) {
      return {
        labels: valuesRows.map(r => r[0]),
        values: valuesRows.map(r => Number(r[1]))
      };
    }
  }
  // Si hay más columnas y todas del mismo largo, asume barras multi-serie (solo extrae primera columna como etiquetas)
  if (valuesRows.every(r => r.length === labels.length)) {
    // Promedia cada columna (salvo primera, si es texto)
    let values = [];
    let cats = [];
    for (let i = 1; i < labels.length; i++) {
      let vals = valuesRows.map(r => Number(r[i]));
      if (vals.every(v => !isNaN(v))) {
        values.push(vals.reduce((a, b) => a + b) / vals.length);
        cats.push(labels[i]);
      }
    }
    if (values.length && cats.length) {
      return {
        labels: cats,
        values
      };
    }
  }
  return null;
}

// Si quieres: función para EXTRAER tabla de cualquier texto, formato markdown, etc.
export function extractTable(text = "") {
  // Busca bloques tipo markdown
  const matches = text.match(/((\|.*\|[\r\n]+)+)/);
  if (matches) {
    const tableRaw = matches[1].trim();
    const rows = tableRaw.split('\n').map(row =>
      row.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    ).filter(r => r.length > 1);
    // Asume primera fila encabezado
    const labels = rows[0];
    const values = rows.slice(1).map(r => r.map(v => isNaN(Number(v)) ? v : Number(v)));
    return { labels, values };
  }
  return null;
}


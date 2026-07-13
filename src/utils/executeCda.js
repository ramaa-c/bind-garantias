const idDe = (item) => Number(item?.socioexecutecdaid ?? item?.SocioExecuteCdaID) || 0;

// El GET devuelve una fila por cada intento de evaluación (no solo la
// vigente), igual que el historial de StatusPlataforma.
export const ordenarEjecucionesCda = (data) => {
  const lista = Array.isArray(data) ? data : data ? [data] : [];
  return [...lista].sort((a, b) => idDe(b) - idDe(a));
};

// Para cada CdaID distinto, se queda con el intento más reciente: es el que
// define si hay que ofrecer "Volver a ejecutar" (Pendiente/Rechazado) o no
// (Aprobado).
export const ultimaEjecucionPorCda = (data) => {
  const ordenado = ordenarEjecucionesCda(data);
  const vistos = new Set();
  const resultado = [];
  for (const item of ordenado) {
    const cdaId = item.cdaid ?? item.CdaID;
    if (vistos.has(cdaId)) continue;
    vistos.add(cdaId);
    resultado.push(item);
  }
  return resultado;
};

export const formatearMomentoControl = (momento) => {
  if (!momento) return "-";
  const fecha = new Date(momento);
  if (Number.isNaN(fecha.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "medium" }).format(fecha);
};

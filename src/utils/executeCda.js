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

// A partir del historial completo de un socio, arma un mapa CdaID -> boolean
// (true=aprobado, false=rechazado, null=pendiente o sin ejecutar todavía)
// con la ÚLTIMA ejecución de cada CDA individual (se excluye CdaID=0, la
// fila sintética de grupo). No importa si esa última ejecución vino de una
// corrida de pantalla completa o de un "Volver a ejecutar"/"Forzar expresión"
// puntual posterior — siempre gana la más reciente por SocioExecuteCdaID.
export const armarEstadoPorCda = (data) => {
  const ultimas = ultimaEjecucionPorCda(data);
  const mapa = new Map();
  ultimas.forEach((item) => {
    const cdaId = Number(item.cdaid ?? item.CdaID ?? -1);
    if (cdaId === 0) return;
    const estadoId = Number(item.estadoexecutecdaid ?? item.EstadoExecuteCdaID ?? 0);
    mapa.set(cdaId, estadoId === 3 ? true : estadoId === 2 ? false : null);
  });
  return mapa;
};

// Evalúa una expresión de agrupación (tokens "cdaN" unidos por and/or, sin
// paréntesis — el motor de CDAs tiene un bug conocido con paréntesis + IDs
// que son prefijo numérico de otro, ver CLAUDE.md) usando lógica de tres
// valores: cada token vale true/false/null (null = pendiente o sin ejecutar).
// "and" tiene mayor precedencia que "or" en el motor real, por eso acá
// primero se separa por " or " y cada tramo se resuelve como AND de sus
// términos. Devuelve true/false/null (null = no se puede determinar todavía,
// aun con corto circuito de and/or).
export const evaluarExpresionAgrupacion = (expresion, estadoPorCda) => {
  const texto = String(expresion || "").trim();
  if (!texto) return null;

  const evaluarTermino = (token) => {
    const match = token.trim().match(/^cda(\d+)$/i);
    if (!match) return null;
    const cdaId = Number(match[1]);
    return estadoPorCda.has(cdaId) ? estadoPorCda.get(cdaId) : null;
  };

  const resultadosOr = texto.split(/\s+or\s+/i).map((tramoAnd) => {
    const terminos = tramoAnd.split(/\s+and\s+/i).map(evaluarTermino);
    if (terminos.some((v) => v === false)) return false;
    if (terminos.some((v) => v === null)) return null;
    return true;
  });

  if (resultadosOr.some((v) => v === true)) return true;
  if (resultadosOr.some((v) => v === null)) return null;
  return false;
};

// Combina la definición VIGENTE del grupo (ExpresionAgrupacion + CDAs activos
// de GrupoCda) con la última ejecución conocida de cada CDA individual, sin
// pegarle de nuevo al backend. Si un CDA se forzó puntualmente después de que
// la pantalla haya cerrado con ese criterio en contra, ya se refleja acá —
// no hace falta esperar a que alguien reejecute el grupo completo (que hoy
// no se puede hacer de forma segura con un override, ver cdaService.js).
export const calcularEstadoEfectivo = ({ historial, expresionAgrupacion, cdasActivosIds }) => {
  const estadoPorCda = armarEstadoPorCda(historial);
  const expresion =
    String(expresionAgrupacion || "").trim() ||
    (cdasActivosIds || []).map((id) => `cda${id}`).join(" and ");

  if (!expresion.trim()) return "pendiente";

  const resultado = evaluarExpresionAgrupacion(expresion, estadoPorCda);
  if (resultado === true) return "aprobado";
  if (resultado === false) return "rechazado";
  return "pendiente";
};

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

// Desde que el backend manda CadenaValorID y PantallaGrupoCdaID en cada fila
// del historial (WSSocioExecuteCda), se puede filtrar por contexto real en
// vez de inferirlo por posición. Las filas viejas (previas a ese cambio) no
// traen estos campos — se tratan como compatibles con cualquier contexto
// (no hay forma de probar que NO correspondan), así que el filtro solo
// descarta una fila cuando SÍ tiene el campo y no coincide.
const coincideConContexto = (item, pantallaGrupoCdaId, cadenaValorId) => {
  const rowPantalla = item?.pantallagrupocdaid ?? item?.PantallaGrupoCdaID;
  const rowCadena = item?.cadenavalorid ?? item?.CadenaValorID;
  if (pantallaGrupoCdaId != null && rowPantalla != null && Number(rowPantalla) !== Number(pantallaGrupoCdaId)) {
    return false;
  }
  if (cadenaValorId != null && rowCadena != null && Number(rowCadena) !== Number(cadenaValorId)) {
    return false;
  }
  return true;
};

// La cadena real de un socio ya no hace falta adivinarla: se toma la de la
// ejecución más reciente que traiga CadenaValorID. Si todo el historial es
// previo al cambio de backend (o el socio nunca se evaluó), no hay forma de
// saberla y se devuelve null — el admin la sigue eligiendo a mano en ese caso.
export const detectarCadenaValorId = (data) => {
  const ordenado = ordenarEjecucionesCda(data);
  const conCadena = ordenado.find((item) => (item.cadenavalorid ?? item.CadenaValorID) != null);
  const id = Number(conCadena?.cadenavalorid ?? conCadena?.CadenaValorID);
  return Number.isNaN(id) || id <= 0 ? null : id;
};

// A partir del historial completo de un socio, arma un mapa CdaID -> boolean
// (true=aprobado, false=rechazado, null=pendiente o sin ejecutar todavía)
// con la ÚLTIMA ejecución de cada CDA individual (se excluye CdaID=0, la
// fila sintética de grupo). No importa si esa última ejecución vino de una
// corrida de pantalla completa o de un "Volver a ejecutar"/"Forzar expresión"
// puntual posterior — siempre gana la más reciente por SocioExecuteCdaID.
//
// Si se pasan cadenaValorId/pantallaGrupoCdaId, se descartan antes las filas
// que digan explícitamente pertenecer a otro contexto (ver
// coincideConContexto) — evita que, por ej., un mismo CdaID vinculado a dos
// cadenas con umbrales distintos mezcle el resultado de una con el de otra.
export const armarEstadoPorCda = (data, { cadenaValorId, pantallaGrupoCdaId } = {}) => {
  const lista = Array.isArray(data) ? data : data ? [data] : [];
  const filtrada =
    cadenaValorId == null && pantallaGrupoCdaId == null
      ? lista
      : lista.filter((item) => coincideConContexto(item, pantallaGrupoCdaId, cadenaValorId));

  const ultimas = ultimaEjecucionPorCda(filtrada);
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
export const calcularEstadoEfectivo = ({
  historial,
  expresionAgrupacion,
  cdasActivosIds,
  cadenaValorId,
  pantallaGrupoCdaId,
}) => {
  const estadoPorCda = armarEstadoPorCda(historial, { cadenaValorId, pantallaGrupoCdaId });
  const expresion =
    String(expresionAgrupacion || "").trim() ||
    (cdasActivosIds || []).map((id) => `cda${id}`).join(" and ");

  if (!expresion.trim()) return "pendiente";

  const resultado = evaluarExpresionAgrupacion(expresion, estadoPorCda);
  if (resultado === true) return "aprobado";
  if (resultado === false) return "rechazado";
  return "pendiente";
};

// Un CDA que se saca del grupo (deshabilitado/desvinculado) deja de
// evaluarse en las próximas corridas de pantalla, pero su última fila queda
// en el historial para siempre — "última ejecución por CdaID" sola no
// alcanza para saber si sigue vigente. Se toman solo los CdaID que
// aparecieron después del PENÚLTIMO cierre de grupo: eso cubre tanto el
// batch que armó el ÚLTIMO cierre como cualquier "Volver a ejecutar"/
// "Forzar expresión" puntual posterior a ese cierre (ver EmpresaDetalle.jsx).
//
// Además, si grupoItem trae CadenaValorID/PantallaGrupoCdaID (filas nuevas),
// se exige que las filas individuales coincidan con ESE contexto —
// evita mezclar, en el mismo batch inferido, CDAs de una prueba contra otra
// cadena que haya quedado sin cerrar su propio grupo (ver
// coincideConContexto). Con grupoItem viejo (sin esos campos) se cae al
// comportamiento anterior, solo por posición de ID.
export const obtenerCdasDeLaCorridaActual = (data) => {
  const historialCompleto = ordenarEjecucionesCda(data);
  const gruposDesc = historialCompleto.filter((item) => Number(item.cdaid ?? item.CdaID ?? -1) === 0);
  const grupoItem = gruposDesc[0] || null;
  const idCorteInferior = gruposDesc[1]
    ? Number(gruposDesc[1].socioexecutecdaid ?? gruposDesc[1].SocioExecuteCdaID) || 0
    : -Infinity;
  const pantallaGrupo = grupoItem?.pantallagrupocdaid ?? grupoItem?.PantallaGrupoCdaID;
  const cadenaGrupo = grupoItem?.cadenavalorid ?? grupoItem?.CadenaValorID;

  const cdaIdsCorridaActual = new Set(
    historialCompleto
      .filter(
        (item) =>
          Number(item.cdaid ?? item.CdaID ?? -1) !== 0 &&
          (Number(item.socioexecutecdaid ?? item.SocioExecuteCdaID) || 0) > idCorteInferior &&
          coincideConContexto(item, pantallaGrupo, cadenaGrupo),
      )
      .map((item) => Number(item.cdaid ?? item.CdaID)),
  );

  const historialContexto = historialCompleto.filter((item) => coincideConContexto(item, pantallaGrupo, cadenaGrupo));
  const ultimasPorCdaContexto = ultimaEjecucionPorCda(historialContexto);

  const cdas = ultimasPorCdaContexto.filter(
    (item) => Number(item.cdaid ?? item.CdaID ?? -1) !== 0 && cdaIdsCorridaActual.has(Number(item.cdaid ?? item.CdaID)),
  );

  return { grupoItem, cdas };
};

// Combina el último cierre de grupo (grupoItem) con el estado MÁS RECIENTE
// de cada CDA de esa corrida (cdas, ver obtenerCdasDeLaCorridaActual) sin
// necesitar la ExpresionAgrupacion vigente de GrupoCda ni que se elija una
// cadena: la combinación lógica (and/or) se infiere del propio texto
// congelado en grupoItem.expresion ("TRUE and TRUE and FALSE"). Si tiene
// algún "or" se trata como OR de todos los miembros; si no, como AND (el
// caso más común — "and" tiene mayor precedencia y casi nunca hace falta
// mezclar, ver CLAUDE.md). Esto es lo que permite mostrar, por ejemplo, que
// un CDA forzado a Aprobado DESPUÉS de un cierre en Rechazado ya destraba el
// resultado combinado, sin tener que elegir la cadena primero.
export const combinarEstadoCdas = (grupoItem, cdas) => {
  if (!grupoItem || !cdas || cdas.length === 0) return null;

  const combinador = /\bor\b/i.test(grupoItem.expresion ?? grupoItem.Expresion ?? "") ? "or" : "and";
  const valores = cdas.map((item) => {
    const estadoId = Number(item.estadoexecutecdaid ?? item.EstadoExecuteCdaID ?? 0);
    return estadoId === 3 ? true : estadoId === 2 ? false : null;
  });

  let resultado;
  if (combinador === "and") {
    resultado = valores.some((v) => v === false) ? false : valores.some((v) => v === null) ? null : true;
  } else {
    resultado = valores.some((v) => v === true) ? true : valores.some((v) => v === null) ? null : false;
  }

  if (resultado === true) return "aprobado";
  if (resultado === false) return "rechazado";
  return "pendiente";
};

// Atajo para quien no tenga ya grupoItem/cdas calculados (ver
// obtenerCdasDeLaCorridaActual + combinarEstadoCdas).
export const calcularEstadoDesdeHistorial = (data) => {
  const { grupoItem, cdas } = obtenerCdasDeLaCorridaActual(data);
  return combinarEstadoCdas(grupoItem, cdas);
};

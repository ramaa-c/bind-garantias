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

// El backend usó 0 (no null) como default de CadenaValorID/PantallaGrupoCdaID
// mientras el INSERT de SocioExecuteCda todavía no los completaba (bug ya
// arreglado, pero deja filas viejas con 0 mezcladas en el mismo historial que
// filas nuevas con el ID real — confirmado con datos reales). 0 nunca es un
// ID real acá, así que se trata como "dato desconocido", igual que null: no
// sirve ni para excluir una fila (no se puede probar que NO corresponda) ni
// como valor buscado (filtrar por CadenaValorID=0 no debe excluir filas con
// ID real).
const esIdValido = (valor) => valor != null && Number(valor) > 0;

// Desde que el backend manda CadenaValorID y PantallaGrupoCdaID en cada fila
// del historial (WSSocioExecuteCda), se puede filtrar por contexto real en
// vez de inferirlo por posición. Las filas viejas (previas a ese cambio, o
// con el bug del INSERT que no las completaba) no traen un ID real — se
// tratan como compatibles con cualquier contexto (no hay forma de probar que
// NO correspondan), así que el filtro solo descarta una fila cuando AMBOS
// lados (lo buscado y la fila) tienen un ID real y no coinciden.
const coincideConContexto = (item, pantallaGrupoCdaId, cadenaValorId) => {
  const rowPantalla = item?.pantallagrupocdaid ?? item?.PantallaGrupoCdaID;
  const rowCadena = item?.cadenavalorid ?? item?.CadenaValorID;
  if (esIdValido(pantallaGrupoCdaId) && esIdValido(rowPantalla) && Number(rowPantalla) !== Number(pantallaGrupoCdaId)) {
    return false;
  }
  if (esIdValido(cadenaValorId) && esIdValido(rowCadena) && Number(rowCadena) !== Number(cadenaValorId)) {
    return false;
  }
  return true;
};

// La cadena real de un socio ya no hace falta adivinarla: se toma la de la
// ejecución más reciente que traiga un CadenaValorID real (>0 — ver
// esIdValido). Si todo el historial es previo al cambio de backend, o cayó
// en la ventana en que el INSERT todavía no lo completaba, no hay forma de
// saberla y se devuelve null — el admin la sigue eligiendo a mano en ese caso.
export const detectarCadenaValorId = (data) => {
  const ordenado = ordenarEjecucionesCda(data);
  const conCadena = ordenado.find((item) => esIdValido(item.cadenavalorid ?? item.CadenaValorID));
  const id = Number(conCadena?.cadenavalorid ?? conCadena?.CadenaValorID);
  return Number.isNaN(id) ? null : id;
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
//
// ⚠️ Un CDA que se desvincula del grupo (Activo=0 en la vinculación) NO debe
// seguir pesando con su último resultado histórico, aunque su token
// ("cdaN") siga mencionado en la ExpresionAgrupacion congelada — la
// desvinculación no reescribe esa expresión sola. Sin este filtro, activar/
// desactivar un CDA ya ejecutado antes no cambiaba nada acá (armarEstadoPorCda
// encuentra su resultado viejo igual), así que ni el badge ni el aviso de
// "los CDA cambiaron" (ver cdaDefinicionCambio en EmpresaDetalle.jsx)
// reaccionaban a esa edición. Se trata como "no evaluado" (null) a cualquier
// CdaID que no esté en cdasActivosIds — si el array no se pasa (undefined),
// no se filtra nada (mismo comportamiento que antes).
export const calcularEstadoEfectivo = ({
  historial,
  expresionAgrupacion,
  cdasActivosIds,
  cadenaValorId,
  pantallaGrupoCdaId,
}) => {
  const estadoPorCdaCompleto = armarEstadoPorCda(historial, { cadenaValorId, pantallaGrupoCdaId });
  const estadoPorCda = cdasActivosIds
    ? new Map(
        [...estadoPorCdaCompleto].filter(([cdaId]) =>
          cdasActivosIds.map(Number).includes(cdaId),
        ),
      )
    : estadoPorCdaCompleto;

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
//
// cdasActivosIds (opcional, solo lo pasa el panel admin — ver
// EmpresaDetalle.jsx) filtra a los CDAs que siguen vinculados antes de
// combinar. Hace falta porque "cdas" viene de obtenerCdasDeLaCorridaActual,
// que ubica el corte de la corrida por SocioExecuteCdaID: si se desvincula
// parte de un grupo (ej. de 3 CDAs a 1) y se reejecuta, y el backend no
// genera un cierre nuevo para un grupo de un solo CDA (confirmado en vivo:
// no siempre lo hace), el corte sigue anclado al cierre viejo — los 2 CDAs
// que ya NO están vinculados, pero que quedan dentro de esa ventana por
// fecha, se siguen combinando como si formaran parte de la corrida nueva.
// Sin este filtro, un CDA desvinculado sigue pesando en estadoSinCadena
// (no solo en estadoEfectivo, que ya se corrigió antes). No se usa para el
// cálculo del cliente (calcularEstadoDesdeHistorial no lo pasa) — ahí
// depender de la vinculación vigente reintroduciría exactamente lo que se
// sacó a propósito (ver useEstadoCdaSocio en useSocios.js).
export const combinarEstadoCdas = (grupoItem, cdas, cdasActivosIds) => {
  if (!cdas || cdas.length === 0) return null;

  const cdasFiltrados = cdasActivosIds
    ? cdas.filter((item) => cdasActivosIds.map(Number).includes(Number(item.cdaid ?? item.CdaID)))
    : cdas;
  if (cdasFiltrados.length === 0) return null;

  // Nunca hubo un cierre de grupo (CdaID=0) para este socio en este
  // contexto — confirmado en vivo: pasa cuando el grupo tiene un solo CDA
  // vinculado (el backend no genera esa fila sintética en ese caso). Sin
  // grupoItem no hay ExpresionAgrupacion congelada de la cual inferir
  // and/or, así que solo se puede resolver sin ambigüedad si hay un único
  // CDA en la corrida — ese resultado ES el del grupo. Con más de uno, no
  // hay forma de saber si el criterio real es and/or sin un cierre o la
  // ExpresionAgrupacion vigente, así que se deja sin determinar (null,
  // el caller lo trata como "pendiente").
  if (!grupoItem) {
    if (cdasFiltrados.length !== 1) return null;
    const estadoId = Number(
      cdasFiltrados[0].estadoexecutecdaid ?? cdasFiltrados[0].EstadoExecuteCdaID ?? 0,
    );
    return estadoId === 3 ? "aprobado" : estadoId === 2 ? "rechazado" : "pendiente";
  }

  // Una ejecución posterior al cierre SIN ValorParticularExpresion es una
  // reevaluación REAL (con la regla real del CDA, no un forzado puntual) —
  // a diferencia de un forzado, que está pensado para coexistir con el
  // resto del cierre viejo, esta reemplaza al cierre entero como veredicto.
  // Confirmado con un caso real: un grupo de 3 CDAs cierra "TRUE and TRUE
  // and FALSE"; se desvinculan 2 y se reejecuta el que queda — el backend
  // no siempre genera un cierre nuevo para un grupo de un solo CDA, así
  // que sin esto, combinarEstadoCdas seguía mezclando el resultado viejo de
  // los 2 CDAs ya desvinculados con el nuevo. Se identifica la ejecución
  // MÁS RECIENTE de todo el batch (no necesariamente la del CDA que había
  // dado el cierre en contra): si es posterior al cierre y no tiene
  // ValorParticularExpresion, decide sola. Si en cambio la más reciente
  // tiene ValorParticularExpresion (forzado explícito), se sigue
  // combinando con el resto vía la lógica de abajo, como ya se hacía.
  const grupoItemId = Number(grupoItem.socioexecutecdaid ?? grupoItem.SocioExecuteCdaID) || 0;
  const masReciente = cdasFiltrados.reduce((acc, item) => {
    const id = Number(item.socioexecutecdaid ?? item.SocioExecuteCdaID) || 0;
    const idAcc = acc ? Number(acc.socioexecutecdaid ?? acc.SocioExecuteCdaID) || 0 : -Infinity;
    return id > idAcc ? item : acc;
  }, null);
  const esReevaluacionRealPostCierre =
    masReciente &&
    !masReciente.valorparticularexpresion &&
    (Number(masReciente.socioexecutecdaid ?? masReciente.SocioExecuteCdaID) || 0) > grupoItemId;

  if (esReevaluacionRealPostCierre) {
    const estadoId = Number(masReciente.estadoexecutecdaid ?? masReciente.EstadoExecuteCdaID ?? 0);
    return estadoId === 3 ? "aprobado" : estadoId === 2 ? "rechazado" : "pendiente";
  }

  const combinador = /\bor\b/i.test(grupoItem.expresion ?? grupoItem.Expresion ?? "") ? "or" : "and";
  const valores = cdasFiltrados.map((item) => {
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

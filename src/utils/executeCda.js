// El historial de un tercero (WSTerceroExecuteCda) tiene la misma forma que
// el de un socio (WSSocioExecuteCda), solo cambia el nombre del ID
// (TerceroExecuteCdaID en vez de SocioExecuteCdaID). Todas las funciones de
// este archivo están escritas contra el shape de socio — cualquiera que
// reciba historial de TERCEROS tiene que pasarlo por acá primero, si no
// idDe() siempre da 0 (el campo que busca no existe) y el ordenamiento por
// "más reciente" queda roto en silencio, terminando en el primer elemento
// del array en vez del último.
export const normalizarHistorialTercero = (data) => {
  const lista = Array.isArray(data) ? data : data ? [data] : [];
  return lista.map((f) => ({
    ...f,
    socioexecutecdaid: f.terceroexecutecdaid ?? f.TerceroExecuteCdaID ?? f.socioexecutecdaid,
  }));
};

const idDe = (item) => Number(item?.socioexecutecdaid ?? item?.SocioExecuteCdaID) || 0;

const estadoDeItem = (item) => {
  const estadoId = Number(item?.estadoexecutecdaid ?? item?.EstadoExecuteCdaID ?? 0);
  return estadoId === 3 ? "aprobado" : estadoId === 2 ? "rechazado" : "pendiente";
};

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

// Combina la definición VIGENTE del grupo (ExpresionAgrupacion + CDAs
// activos de GrupoCda) con el estado de cada CDA DENTRO DE LA CORRIDA ACTUAL
// (cdasCorridaActual — ver obtenerCdasDeLaCorridaActual), sin pegarle de
// nuevo al backend. Si un CDA se forzó puntualmente después de que la
// pantalla haya cerrado con ese criterio en contra, ya se refleja acá — no
// hace falta esperar a que alguien reejecute el grupo completo (que hoy no
// se puede hacer de forma segura con un override, ver cdaService.js).
//
// ⚠️ A propósito NO busca en TODO el historial (antes usaba
// armarEstadoPorCda sin restricción): un CDA reactivado (Activo=1 de
// nuevo) cuya única ejecución real quedó vieja, de antes de varios
// cierres, contaba igual como "conocido" con ese valor añejo — haciendo
// que estadoEfectivo pareciera coincidir con estadoSinCadena (sin avisar
// de nada) aunque nadie lo haya evaluado en la corrida actual. Ahora, si un
// CDA vigente no aparece en cdasCorridaActual, cuenta como no evaluado
// (null) acá también — igual que ya pasa en estadoSinCadena — así que
// reactivar un CDA con dato viejo siempre difiere del resultado ya
// evaluado (dispara cdaDefinicionCambio) hasta que se lo reejecute de
// verdad. Mismo criterio para un CDA desvinculado (Activo=0): si no está
// en cdasActivosIds, tampoco cuenta — si el array no se pasa (undefined),
// no se filtra nada.
export const calcularEstadoEfectivo = ({
  cdasCorridaActual,
  expresionAgrupacion,
  cdasActivosIds,
}) => {
  const estadoPorCdaCompleto = new Map();
  (cdasCorridaActual || []).forEach((item) => {
    const cdaId = Number(item?.cdaid ?? item?.CdaID ?? -1);
    if (cdaId === 0) return;
    const estadoId = Number(item?.estadoexecutecdaid ?? item?.EstadoExecuteCdaID ?? 0);
    estadoPorCdaCompleto.set(cdaId, estadoId === 3 ? true : estadoId === 2 ? false : null);
  });
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

  // Expresión vacía con cdasActivosIds definido (aunque sea []) significa
  // que la vinculación vigente no tiene ningún CDA activo: no hay nada que
  // validar, así que no debe bloquear al socio. Si cdasActivosIds ni
  // siquiera se pasó, no hay información de vinculación (no confundir los
  // casos): ahí se mantiene "pendiente". Nunca se había probado el caso de
  // cero CDAs vinculados antes de esto.
  if (!expresion.trim()) return cdasActivosIds ? "aprobado" : "pendiente";

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
//
// cdaIdsDelCierre: CdaIDs que integraron el batch que produjo grupoItem
// (SocioExecuteCdaID entre el penúltimo cierre y este, inclusive). Sirve
// para que combinarEstadoCdas distinga un CDA que actualiza/fuerza su lugar
// DENTRO de ese grupo (mismo id que un miembro del cierre) de un CDA ajeno
// a él (id que nunca fue miembro de ESE cierre) — señal de que el grupo
// cambió de composición sin generar un cierre nuevo (ver combinarEstadoCdas).
export const obtenerCdasDeLaCorridaActual = (data) => {
  const historialCompleto = ordenarEjecucionesCda(data);
  const gruposDesc = historialCompleto.filter((item) => Number(item.cdaid ?? item.CdaID ?? -1) === 0);
  const grupoItem = gruposDesc[0] || null;
  const idCorteInferior = gruposDesc[1]
    ? Number(gruposDesc[1].socioexecutecdaid ?? gruposDesc[1].SocioExecuteCdaID) || 0
    : -Infinity;
  const grupoItemId = grupoItem ? idDe(grupoItem) : -Infinity;
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

  const cdaIdsDelCierre = new Set(
    historialCompleto
      .filter(
        (item) =>
          Number(item.cdaid ?? item.CdaID ?? -1) !== 0 &&
          (Number(item.socioexecutecdaid ?? item.SocioExecuteCdaID) || 0) > idCorteInferior &&
          (Number(item.socioexecutecdaid ?? item.SocioExecuteCdaID) || 0) <= grupoItemId &&
          coincideConContexto(item, pantallaGrupo, cadenaGrupo),
      )
      .map((item) => Number(item.cdaid ?? item.CdaID)),
  );

  const historialContexto = historialCompleto.filter((item) => coincideConContexto(item, pantallaGrupo, cadenaGrupo));
  const ultimasPorCdaContexto = ultimaEjecucionPorCda(historialContexto);

  const cdas = ultimasPorCdaContexto.filter(
    (item) => Number(item.cdaid ?? item.CdaID ?? -1) !== 0 && cdaIdsCorridaActual.has(Number(item.cdaid ?? item.CdaID)),
  );

  return { grupoItem, cdas, cdaIdsDelCierre };
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
// combinar — es información vigente que el cliente a propósito no usa (ver
// useEstadoCdaSocio en useSocios.js).
//
// cdaIdsDelCierre (ver obtenerCdasDeLaCorridaActual) es lo que sí usa el
// cliente para distinguir, DE PURO HISTORIAL, dos situaciones muy
// distintas cuando hay CDAs posteriores al último cierre (o directamente
// sin ningún cierre):
//   1. Actualizan/fuerzan un CDA que YA era miembro de ese cierre (mismo
//      id) — es un "Volver a ejecutar"/"Forzar expresión" puntual DENTRO
//      del mismo grupo: se recombina con el resto de los miembros, como ya
//      hacía este cálculo.
//   2. Aparecen uno o más CDAs AJENOS al cierre (id que nunca fue miembro
//      de él) — pasa cuando el admin fue desvinculando/vinculando CDAs
//      distintos de a uno (el backend no genera cierre para un grupo de un
//      solo CDA, así que cada prueba mono-CDA sucesiva queda suelta en el
//      historial). NO es un caso raro ni ambiguo: cada una de esas
//      ejecuciones sueltas fue, en su momento, "todo el grupo" — así que
//      gana siempre la MÁS RECIENTE (mayor SocioExecuteCdaID) de todas
//      ellas, e ignora tanto a los miembros viejos del cierre como a
//      cualquier otro ajeno más antiguo. Mismo criterio, sin ningún
//      cierre en absoluto (grupoItem null): puede haber varios CDAs
//      distintos probados uno a la vez a lo largo del tiempo — gana el
//      más reciente igual.
// Esto es lo que permite que "el socio no pierda acceso porque se va
// modificando el grupo de la cadena": su condición queda fija en lo último
// que se evaluó para él hasta que un admin lo reejecute — ni retrocede por
// un CDA nuevo sin evaluar, ni por uno viejo que se desvinculó, siempre que
// haya una ejecución puntual del nuevo/único CDA que lo reemplaza.
export const combinarEstadoCdas = (grupoItem, cdas, cdasActivosIds, cdaIdsDelCierre) => {
  if (!cdas || cdas.length === 0) return null;

  const cdasFiltrados = cdasActivosIds
    ? cdas.filter((item) => cdasActivosIds.map(Number).includes(Number(item.cdaid ?? item.CdaID)))
    : cdas;
  if (cdasFiltrados.length === 0) return null;

  const masReciente = (lista) => lista.reduce((acc, item) => (idDe(item) > idDe(acc) ? item : acc));

  // Nunca hubo un cierre de grupo (CdaID=0) para este socio en este
  // contexto — confirmado en vivo: pasa cuando el grupo tiene un solo CDA
  // vinculado (el backend no genera esa fila sintética en ese caso). Sin
  // grupoItem no hay ExpresionAgrupacion congelada de la cual inferir
  // and/or, pero eso no es un problema: si hay más de un CDA distinto acá,
  // son pruebas mono-CDA sucesivas (se fue reconfigurando el grupo de a
  // un CDA por vez) — gana la más reciente.
  if (!grupoItem) {
    return estadoDeItem(masReciente(cdasFiltrados));
  }

  if (cdaIdsDelCierre) {
    const ajenos = cdasFiltrados.filter(
      (item) => !cdaIdsDelCierre.has(Number(item.cdaid ?? item.CdaID)),
    );
    if (ajenos.length > 0) return estadoDeItem(masReciente(ajenos));
    // ajenos.length === 0: todos los de cdasFiltrados ya eran miembros del
    // cierre (o actualizaciones/forzados de ellos) — sigue el combine normal.
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
// obtenerCdasDeLaCorridaActual + combinarEstadoCdas). Es lo que usa el
// gate del cliente (useEstadoCdaSocio): puro historial, sin vinculación
// vigente — ver el comentario de combinarEstadoCdas sobre cdaIdsDelCierre.
export const calcularEstadoDesdeHistorial = (data) => {
  const { grupoItem, cdas, cdaIdsDelCierre } = obtenerCdasDeLaCorridaActual(data);
  return combinarEstadoCdas(grupoItem, cdas, undefined, cdaIdsDelCierre);
};

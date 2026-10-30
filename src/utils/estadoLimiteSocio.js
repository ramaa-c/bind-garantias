// Catálogo único de estados, compartido por TipoLimiteSocio.TipoLimiteEstadoID
// y SolicitudEnProceso.EstadoSolicitud. NO es el catálogo TipoLimiteEstado
// heredado de SGR+.
export const ESTADO_INICIAL = 1;
export const ESTADO_PENDIENTE = 2;
export const ESTADO_APROBADA = 3;
export const ESTADO_CANCELADA = 4;
export const ESTADO_VENCIDA = 5;
export const ESTADO_RECHAZADA = 6;

export const esEstadoEnCurso = (estadoId) => {
  const estado = Number(estadoId ?? ESTADO_PENDIENTE);
  return estado === ESTADO_INICIAL || estado === ESTADO_PENDIENTE;
};

// TerceroViaID de SolicitudEnProceso: identifica la plataforma de origen de
// la solicitud, no la cadena de valor. La nuestra es 4000000 - otras
// plataformas usan 2000000/3000000 (confirmado con el backend el 2026-08-13).
// Un socio puede tener varias solicitudes en curso al mismo tiempo dentro de
// NUESTRA plataforma (en distintas cadenas) sin problema; lo que hay que
// evitar es dejarlo arrancar una acá si ya tiene una en curso en OTRA
// plataforma, sobre la que no tenemos control.
export const TERCERO_VIA_PLATAFORMA_PROPIA = 4000000;

export const esProcesoDeOtraPlataforma = (proceso) => {
  const terceroVia = proceso?.terceroviaid ?? proceso?.TerceroViaID;
  if (terceroVia === null || terceroVia === undefined || terceroVia === "") return false;
  return Number(terceroVia) !== TERCERO_VIA_PLATAFORMA_PROPIA;
};

export const MENSAJE_SOLICITUD_OTRA_PLATAFORMA =
  "Tenés una solicitud de línea en curso en otra plataforma. Hasta que se resuelva no podés iniciar una operación nueva ni avanzar con tu legajo y documentación desde acá.";

// Mensajes de rechazo automático (guardados en TipoLimiteSocio.Observaciones
// cuando el propio frontend rechaza una solicitud, sin intervención del
// admin). Concisos a propósito: no exponen los parámetros/valores concretos
// que se evaluaron, solo el motivo. Se muestran en DetalleSolicitudModal.
export const MOTIVOS_RECHAZO_AUTOMATICO = {
  PORCENTAJE_MINIMO_SOLICITUD:
    "El monto solicitado no alcanza el porcentaje mínimo permitido para esta línea.",
};

// TipoLimiteEstadoID=Rechazada (6) se usa tanto para un rechazo automático
// (CDA de línea / PorcentajeMinimoSolicitud, al momento de crear la
// solicitud, ver AltaOperacion.jsx) como para un rechazo manual del admin
// (RechazarSolicitudModal) - no hay un campo aparte que distinga cuál fue.
// Este prefijo en Observaciones es la única forma de diferenciarlos en
// Dashboard.jsx sin inventar un estado nuevo; se muestra tal cual (no se
// oculta) porque es información real y sirve también del lado cliente.
export const PREFIJO_RECHAZO_AUTOMATICO = "Rechazo automático:";

export const construirMotivoRechazoAutomatico = (motivo) =>
  `${PREFIJO_RECHAZO_AUTOMATICO} ${motivo}`;

// Sin distinguir acentos: la API también deja ese prefijo cuando rechaza sola
// por el porcentaje mínimo ("Rechazo automatico: ...").
const sinAcentos = (texto) => String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "");

export const esRechazoAutomatico = (observaciones) =>
  sinAcentos(observaciones).startsWith(sinAcentos(PREFIJO_RECHAZO_AUTOMATICO));

const claveLinea = (s) =>
  `${Number(s.tipolimiteid ?? s.TipoLimiteID)}-${Number(s.cadenavalorid ?? s.CadenaValorID)}`;

const comoLista = (valor) => (Array.isArray(valor) ? valor : valor ? [valor] : []);

const procesosAbiertos = (solicitudesEnProceso) =>
  comoLista(solicitudesEnProceso).filter(
    (p) => Number(p.estadosolicitud ?? p.EstadoSolicitud ?? ESTADO_PENDIENTE) <= ESTADO_PENDIENTE,
  );

export const procesosHuerfanosPorRechazoAutomatico = (solicitudesEnProceso, limitesSocio) => {
  const limites = comoLista(limitesSocio);
  const clavesRechazoAutomatico = new Set(
    limites
      .filter(
        (l) =>
          Number(l.tipolimiteestadoid) === ESTADO_RECHAZADA &&
          esRechazoAutomatico(l.observaciones),
      )
      .map(claveLinea),
  );
  const clavesVigentes = new Set(
    limites
      .filter(
        (l) =>
          esEstadoEnCurso(l.tipolimiteestadoid) ||
          Number(l.tipolimiteestadoid) === ESTADO_APROBADA,
      )
      .map(claveLinea),
  );
  return procesosAbiertos(solicitudesEnProceso).filter((p) => {
    const clave = claveLinea(p);
    return clavesRechazoAutomatico.has(clave) && !clavesVigentes.has(clave);
  });
};

export const procesosVigentes = (solicitudesEnProceso, limitesSocio) => {
  const huerfanos = new Set(
    procesosHuerfanosPorRechazoAutomatico(solicitudesEnProceso, limitesSocio),
  );
  return procesosAbiertos(solicitudesEnProceso).filter(
    (p) => !huerfanos.has(p) && !esProcesoDeOtraPlataforma(p),
  );
};

export const procesosDeOtraPlataforma = (solicitudesEnProceso) =>
  procesosAbiertos(solicitudesEnProceso).filter(esProcesoDeOtraPlataforma);

export const quitarPrefijoRechazoAutomatico = (observaciones) =>
  esRechazoAutomatico(observaciones)
    ? String(observaciones).slice(PREFIJO_RECHAZO_AUTOMATICO.length).trim()
    : String(observaciones || "").trim();

export const MOTIVO_CANCELACION_SOCIO = "Cancelada por el socio desde la plataforma.";

export const estadoTextoDesde = (tipolimiteestadoid) => {
  const id = Number(tipolimiteestadoid);
  if (id === ESTADO_APROBADA) return "Aprobada";
  if (id === ESTADO_RECHAZADA) return "Rechazada";
  if (id === ESTADO_CANCELADA) return "Cancelada";
  if (id === ESTADO_VENCIDA) return "Vencida";
  return "Pendiente";
};

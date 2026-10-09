// Catálogo único de estados, compartido por TipoLimiteSocio.TipoLimiteEstadoID
// y SolicitudEnProceso.EstadoSolicitud. NO es el catálogo TipoLimiteEstado
// heredado de SGR+.
export const ESTADO_INICIAL = 1;
export const ESTADO_PENDIENTE = 2;
export const ESTADO_APROBADA = 3;
export const ESTADO_CANCELADA = 4;
export const ESTADO_VENCIDA = 5;
export const ESTADO_RECHAZADA = 6;

// TerceroViaID de SolicitudEnProceso: identifica la plataforma de origen de
// la solicitud, no la cadena de valor. La nuestra es 4000000 - otras
// plataformas usan 2000000/3000000 (confirmado con el backend el 2026-08-13).
// Un socio puede tener varias solicitudes en curso al mismo tiempo dentro de
// NUESTRA plataforma (en distintas cadenas) sin problema; lo que hay que
// evitar es dejarlo arrancar una acá si ya tiene una en curso en OTRA
// plataforma, sobre la que no tenemos control.
export const TERCERO_VIA_PLATAFORMA_PROPIA = 4000000;

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

export const esRechazoAutomatico = (observaciones) =>
  String(observaciones || "").startsWith(PREFIJO_RECHAZO_AUTOMATICO);

export const MOTIVO_CANCELACION_SOCIO = "Cancelada por el socio desde la plataforma.";

export const estadoTextoDesde = (tipolimiteestadoid) => {
  const id = Number(tipolimiteestadoid);
  if (id === ESTADO_APROBADA) return "Aprobada";
  if (id === ESTADO_RECHAZADA) return "Rechazada";
  if (id === ESTADO_CANCELADA) return "Cancelada";
  if (id === ESTADO_VENCIDA) return "Vencida";
  return "Pendiente";
};

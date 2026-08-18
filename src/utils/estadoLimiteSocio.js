// Catálogo único de estados (WSSolicitudEnProceso.EstadoSolicitud), ahora
// compartido literalmente por TipoLimiteSocio.TipoLimiteEstadoID y
// SolicitudEnProceso.EstadoSolicitud — unificado con Victor el 2026-08-18,
// con migración de los datos existentes de TipoLimiteSocio a esta escala a
// cargo del backend. Antes TipoLimiteSocio tenía su propia escala
// (-2 Cancelada / -1 Rechazada / 0 Pendiente / 1 Aprobada); ahora usa
// exactamente los mismos 5 valores que SolicitudEnProceso, así que sincronizar
// el estado entre las dos tablas ya no requiere traducir nada.
//
// NO es el catálogo TipoLimiteEstado heredado de SGR+ (ese trae ~25 estados
// de un flujo de crédito bancario que no usamos).
export const ESTADO_INICIAL = 1;
export const ESTADO_EN_PROCESO = 2;
export const ESTADO_COMPLETO = 3;
export const ESTADO_CANCELADO = 4;
export const ESTADO_VENCIDO = 5;

// Alias con los nombres que ya usa el resto del código (Dashboard, cliente):
// Pendiente = EnProceso, Aprobada = Completo. Rechazada (decisión del
// admin) y Cancelada (decisión del propio socio) antes eran dos estados
// distintos (-1 y -2); el catálogo nuevo solo tiene un estado terminal
// negativo "real" (Cancelado). Como workaround TEMPORAL para no perder la
// distinción, Cancelada pisa el valor de Vencido (5) — un estado que hoy no
// usamos para nada — hasta que Victor agregue un indicador propio para
// distinguirlas de verdad. Sacar este workaround el día que eso pase: ver
// mensaje del 2026-08-18.
export const ESTADO_PENDIENTE = ESTADO_EN_PROCESO;
export const ESTADO_APROBADA = ESTADO_COMPLETO;
export const ESTADO_RECHAZADA = ESTADO_CANCELADO;
export const ESTADO_CANCELADA = ESTADO_VENCIDO;

// TerceroViaID de SolicitudEnProceso: identifica la plataforma de origen de
// la solicitud, no la cadena de valor. La nuestra es 4000000 - otras
// plataformas usan 2000000/3000000 (confirmado con Victor el 2026-08-13).
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

export const estadoTextoDesde = (tipolimiteestadoid) => {
  const id = Number(tipolimiteestadoid);
  if (id === ESTADO_COMPLETO) return "Aprobada";
  if (id === ESTADO_RECHAZADA) return "Rechazada";
  if (id === ESTADO_CANCELADA) return "Cancelada";
  return "Pendiente";
};

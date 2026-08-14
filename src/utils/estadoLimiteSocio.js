// Estado propio de la solicitud (TipoLimiteSocio.TipoLimiteEstadoID): NO es
// el catálogo TipoLimiteEstado heredado de SGR+ (ese trae ~25 estados de un
// flujo de crédito bancario que no usamos). Fuente única de verdad para
// admin (Dashboard) y cliente (Solicitudes) - antes cada pantalla tenía su
// propia interpretación de estos números y quedaban desincronizadas.
export const ESTADO_RECHAZADA = -1;
export const ESTADO_PENDIENTE = 0;
export const ESTADO_APROBADA = 1;
// Cancelada por el propio socio (distinta de Rechazada, que es una decisión
// del administrador) - se guarda en el mismo campo para no necesitar una
// columna nueva.
export const ESTADO_CANCELADA = -2;

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
  if (id === ESTADO_APROBADA) return "Aprobada";
  if (id === ESTADO_RECHAZADA) return "Rechazada";
  if (id === ESTADO_CANCELADA) return "Cancelada";
  return "Pendiente";
};

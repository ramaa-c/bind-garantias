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

export const estadoTextoDesde = (tipolimiteestadoid) => {
  const id = Number(tipolimiteestadoid);
  if (id === ESTADO_APROBADA) return "Aprobada";
  if (id === ESTADO_RECHAZADA) return "Rechazada";
  if (id === ESTADO_CANCELADA) return "Cancelada";
  return "Pendiente";
};

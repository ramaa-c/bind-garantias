import { RELACIONES_TERCEROS_BASE } from "../constants/tiposRelacionSocio";

// La respuesta de api/TipoRelacionSocio (ver tipoRelacionSocioService) llega
// en distintas formas según el endpoint devuelva un array plano o uno
// envuelto - se normaliza acá una sola vez para no repetir el mismo
// `Array.isArray(...) ? ... : ...` en cada consumidor.
export const normalizarCatalogoActivo = (data) => {
  const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
  return arr
    .map((item) => ({
      id: Number(item.tiporelacionsocioid ?? item.TipoRelacionSocioID),
      descripcion: item.descripcion ?? item.Descripcion ?? "",
    }))
    .filter((item) => item.id > 0);
};

// Accionista es estructuralmente distinto de los otros 3 (tiene % de
// participación, pide DNI, tiene reglas de CDA propias sobre la
// composición accionaria - es información que la SGR necesita sí o sí) -
// es el único de los 4 que no se apaga aunque el admin todavía no lo haya
// activado en /admin/tipos-relacion-socio para este ambiente. Los otros 3
// (representanteLegal/apoderados/agentesBolsa) sí dependen de estar
// activados: si no lo están, quedan afuera.
const CLAVE_SIEMPRE_ACTIVA = "accionistas";

// De los 4 tipos de terceros con flujo de carga propio (ver
// constants/tiposRelacionSocio.js), devuelve los que el admin efectivamente
// activó en /admin/tipos-relacion-socio para este ambiente (más Accionista,
// que siempre está), con la descripción viva que le hayan puesto (o
// `undefined` si ese ID no está en el catálogo - el caller cae a su propio
// título estático de respaldo). Un ambiente que todavía no cargó nada de
// esto (ej. desa recién levantado) devuelve solo Accionista - las pantallas
// que consumen esto quedan sin las otras 3 relaciones en vez de asumir que
// siempre existen.
export const resolverRelacionesBaseActivas = (catalogoActivo) => {
  const descripcionPorId = new Map(catalogoActivo.map((it) => [it.id, it.descripcion]));
  return RELACIONES_TERCEROS_BASE.filter(
    (r) => r.clave === CLAVE_SIEMPRE_ACTIVA || descripcionPorId.has(r.tipoRelacionSocioId),
  ).map((r) => ({ ...r, descripcion: descripcionPorId.get(r.tipoRelacionSocioId) }));
};

// "Activo" ("1"/"0") es el reemplazo del borrado físico de un CDA: uno en
// "0" se comporta como eliminado y no debe aparecer en ningún listado.
export const esCdaActivo = (cda) => {
  if (!cda) return false;
  const valor = cda.activo ?? cda.Activo;
  return valor === undefined || valor === null || String(valor) !== "0";
};

// A diferencia de esCdaActivo (que tolera "" para no romper la vinculación
// de CDAs migrados que ya estaban linkeados), esta versión es estricta:
// solo cuenta como activo un CDA con Activo="1" explícito. Se usa en los
// listados donde se decide qué CDAs mostrar/vincular (CdasGlobales,
// CdaPanel) — no en los chequeos de vinculación existente, que siguen
// usando esCdaActivo.
export const esCdaActivoEstricto = (cda) => String(cda?.activo ?? cda?.Activo ?? "") === "1";

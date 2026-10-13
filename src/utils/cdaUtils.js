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

// Compartidos entre CdasGlobales.jsx (listado) y CdaFormPage.jsx (alta/
// edición) - antes vivían duplicados en un solo archivo que hacía las dos
// cosas; separados en dos páginas/rutas, necesitan un lugar común.
export const getCdaId = (c) => {
  if (!c) return undefined;
  return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
};

export const getCdaProp = (c, propName) => {
  if (!c) return "";
  const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
  const val = c[propName] !== undefined ? c[propName] : c[pascal];
  return val !== undefined && val !== null ? val : "";
};

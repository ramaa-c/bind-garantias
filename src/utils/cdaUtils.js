// "Activo" ("1"/"0") es el reemplazo del borrado físico de un CDA: uno en
// "0" se comporta como eliminado y no debe aparecer en ningún listado.
export const esCdaActivo = (cda) => {
  if (!cda) return false;
  const valor = cda.activo ?? cda.Activo;
  return valor === undefined || valor === null || String(valor) !== "0";
};

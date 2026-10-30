export const FAMILIA_LINEA = {
  CHEQUE: "cheque",
  PAGARE: "pagare",
  PRESTAMO: "prestamo",
};

export const ETIQUETA_FAMILIA_LINEA = {
  [FAMILIA_LINEA.CHEQUE]: "Cheque",
  [FAMILIA_LINEA.PAGARE]: "Pagaré",
  [FAMILIA_LINEA.PRESTAMO]: "Préstamo",
};

const normalizarTexto = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();

export const familiaDeLinea = (tiposLimite, tipoLimiteId) => {
  const lista = Array.isArray(tiposLimite) ? tiposLimite : tiposLimite?.raw || [];
  const item = lista.find((t) => Number(t.tipolimiteid) === Number(tipoLimiteId));
  const descripcion = normalizarTexto(item?.descripcion);
  if (descripcion.includes("CHEQUE")) return FAMILIA_LINEA.CHEQUE;
  if (descripcion.includes("PAGARE")) return FAMILIA_LINEA.PAGARE;
  return FAMILIA_LINEA.PRESTAMO;
};

export const etiquetaFamiliaDeLinea = (tiposLimite, tipoLimiteId) =>
  ETIQUETA_FAMILIA_LINEA[familiaDeLinea(tiposLimite, tipoLimiteId)];

export const OPERADORES_POR_TIPO = {
  texto: ["=", "<>"],
  booleano: ["=", "<>"],
  numero: ["=", "<>", ">", "<", ">=", "<="],
  cantidad: ["=", "<>", ">", "<", ">=", "<="],
  fecha: ["=", ">", "<", ">=", "<="],
};

export const VALORES_SUGERIDOS = {
  "afip.datosgenerales.tipopersona": ["FISICA", "JURIDICA"],
  "afip.datosgenerales.estadoclave": ["ACTIVO"],
  "afip.datosgenerales.tipoclave": ["CUIT"],
  "afip.datosgenerales.essucesion": ["SI", "NO"],
};

export const tieneValoresSugeridos = (expresion) =>
  Boolean(VALORES_SUGERIDOS[String(expresion || "").trim().toLowerCase()]);

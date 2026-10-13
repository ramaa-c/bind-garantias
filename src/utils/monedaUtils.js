export const MONEDA_PESOS = "5000";

const SIMBOLOS_MONEDA = {
  2: "U$D",
  10: "UVAS",
  500: "€",
  5000: "$",
};

export const simboloMoneda = (monedaId) => SIMBOLOS_MONEDA[String(monedaId)] || "$";

export const esMonedaPesos = (monedaId) => !monedaId || String(monedaId) === MONEDA_PESOS;

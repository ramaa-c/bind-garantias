export const MONEDA_PESOS = "5000";
export const MONEDA_DOLAR = "2";

export const esMonedaPesos = (monedaId) => !monedaId || String(monedaId) === MONEDA_PESOS;

export const importeEnPesosDeLimite = (limite) =>
  Number(limite?.importelimite ?? limite?.ImporteLimite) || 0;

export const importeOriginalDeLimite = (limite) => {
  const monedaId = limite?.monedaid ?? limite?.MonedaId ?? limite?.MonedaID;
  const importePesos = importeEnPesosDeLimite(limite);
  if (esMonedaPesos(monedaId)) return importePesos;
  const importeMonex = Number(limite?.importemonex ?? limite?.ImporteMonex) || 0;
  return importeMonex > 0 ? importeMonex : importePesos;
};

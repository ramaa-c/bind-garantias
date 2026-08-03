// Fecha/hora actual en formato yyyy-MM-ddTHH:mm:ss (hora de Argentina), para
// el campo "Momento" que espera el backend en los endpoints de CDAs
// (Cda, CdaCadenaValor, GrupoCda). El backend no lo completa solo pese a lo
// que se dijo en un principio: si no se manda, guarda una fecha vieja.
export const momentoActual = () => {
  const formateado = new Date().toLocaleString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
  return formateado.replace(" ", "T");
};

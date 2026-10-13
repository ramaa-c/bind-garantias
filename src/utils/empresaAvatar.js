const PALABRAS_IGNORADAS = ["S.A.", "S.R.L.", "S.A.S.", "DE", "DEL", "LA", "LOS", "LAS"];

export const obtenerInicialesEmpresa = (nombre = "") => {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 && !PALABRAS_IGNORADAS.includes(p.toUpperCase()));

  if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase();
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return nombre.slice(0, 2).toUpperCase();
};

const VARIANTES_AVATAR = ["azul", "verde", "amarillo", "coral"];

// Misma variante para el mismo nombre en toda la app (Sidebar, Seleccionar
// Empresa, etc.) — el color queda como parte de la identidad visual de esa
// empresa, no un valor random distinto en cada pantalla.
export const obtenerVarianteAvatarEmpresa = (nombre = "") => {
  const code = nombre.charCodeAt(0) || 0;
  return VARIANTES_AVATAR[code % VARIANTES_AVATAR.length];
};

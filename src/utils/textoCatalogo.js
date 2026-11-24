const PALABRAS_CON_TILDE = {
  categoria: "categoría",
  clasificacion: "clasificación",
  construccion: "construcción",
  informacion: "información",
  mineria: "minería",
  pequena: "pequeña",
};

const LETRAS = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

const estaTodoEnMayusculas = (texto) =>
  /[A-ZÁÉÍÓÚÜÑ]/.test(texto) && texto === texto.toUpperCase();

const conMismaInicial = (original, reemplazo) =>
  original[0] === original[0].toUpperCase()
    ? reemplazo[0].toUpperCase() + reemplazo.slice(1)
    : reemplazo;

export const formatearTextoCatalogo = (texto) => {
  const limpio = String(texto ?? "").trim().replace(/\s+/g, " ");
  if (!limpio) return "";
  const base = estaTodoEnMayusculas(limpio)
    ? limpio.charAt(0) + limpio.slice(1).toLowerCase()
    : limpio;
  return base.replace(LETRAS, (palabra) => {
    const conTilde = PALABRAS_CON_TILDE[palabra.toLowerCase()];
    return conTilde ? conMismaInicial(palabra, conTilde) : palabra;
  });
};

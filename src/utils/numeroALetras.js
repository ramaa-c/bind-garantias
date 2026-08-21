const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const ESPECIALES_10_19 = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
const ESPECIALES_20_29 = ["veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

// Apócope de "uno" al anteponerse a un sustantivo masculino ("mil"/"millones"):
// "uno" -> "un", "veintiuno" -> "veintiún". El resto de las decenas
// compuestas ("treinta y uno mil") queda con la forma levemente menos pura
// pero igual de entendible - no es una leyenda de cheque, es una ayuda visual.
const apocope = (palabra) => {
  if (palabra === "uno") return "un";
  if (palabra === "veintiuno") return "veintiún";
  return palabra;
};

const convertirGrupo = (n) => {
  if (n === 0) return "";
  if (n === 100) return "cien";

  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes = [];

  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(ESPECIALES_10_19[resto - 10]);
    else if (resto < 30) partes.push(ESPECIALES_20_29[resto - 20]);
    else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      partes.push(unidad > 0 ? `${DECENAS[decena]} y ${UNIDADES[unidad]}` : DECENAS[decena]);
    }
  }

  return partes.join(" ");
};

// Convierte la parte entera de un número a su forma en palabras, en español,
// hasta 999.999.999.999 (cada grupo de "miles de millones"/"millones"/"mil"
// se arma con convertirGrupo, que solo resuelve 0-999). El tope original era
// 999.999.999: se quedaba corto para líneas de crédito reales de algunas
// cadenas (ej. montos de miles de millones de pesos en bancos grandes), que
// silenciosamente no mostraban nada por caer "fuera de rango" acá. Devuelve
// null para 0 o fuera de rango, así el llamador decide no mostrar nada en
// vez de un texto confuso.
export const numeroALetras = (numero) => {
  const n = Math.floor(Math.abs(Number(numero) || 0));
  if (n <= 0 || n >= 1_000_000_000_000) return null;

  const milesDeMillones = Math.floor(n / 1_000_000_000);
  const millones = Math.floor((n % 1_000_000_000) / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes = [];

  if (milesDeMillones === 1) partes.push("mil millones");
  else if (milesDeMillones > 1) partes.push(`${apocope(convertirGrupo(milesDeMillones))} mil millones`);

  if (millones === 1) partes.push("un millón");
  else if (millones > 1) partes.push(`${apocope(convertirGrupo(millones))} millones`);

  if (miles === 1) partes.push("mil");
  else if (miles > 1) partes.push(`${apocope(convertirGrupo(miles))} mil`);

  if (resto > 0) partes.push(convertirGrupo(resto));

  const frase = partes.join(" ").trim();
  if (!frase) return null;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
};

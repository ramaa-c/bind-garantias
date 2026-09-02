/**
 * Utilidades para parsear direcciones de AFIP / LUFE.
 * Extrae la calle, número, piso y departamento/oficina/manzana.
 */
export const decodeHtmlEntities = (text) => {
  if (!text) return "";
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&ntilde;": "ñ",
    "&Ntilde;": "Ñ",
    "&aacute;": "á",
    "&eacute;": "é",
    "&iacute;": "í",
    "&oacute;": "ó",
    "&uacute;": "ú",
    "&Aacute;": "Á",
    "&Eacute;": "É",
    "&Iacute;": "Í",
    "&Oacute;": "Ó",
    "&Uacute;": "Ú",
  };
  return text.replace(/&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g, (match) => {
    if (entities[match]) return entities[match];
    if (match.startsWith("&#x")) return String.fromCharCode(parseInt(match.slice(3, -1), 16));
    if (match.startsWith("&#")) return String.fromCharCode(parseInt(match.slice(2, -1), 10));
    return match;
  });
};

export const parseAddress = (fullAddress) => {
  if (!fullAddress) return { calle: "", numero: null, piso: "", departamento: "" };

  let calle = decodeHtmlEntities(fullAddress).trim();
  // null = "no se encontró número en el texto" (equivale a "sin número");
  // 0 es una altura de calle válida en Argentina, no puede compartir el
  // mismo valor que "no encontrado" o quedaba tratada como si faltara.
  let numero = null;
  let piso = "";
  let departamento = "";

  // 1. Intentar emparejar y extraer formato "Piso" o similar
  // Usamos \b para no matchear letras dentro de palabras como "HIPOLITO"
  const pisoRegex = /\b(?:piso|piso:)\s*([a-z0-9-]+)\b/i;
  const pisoMatch = calle.match(pisoRegex);
  if (pisoMatch) {
    piso = pisoMatch[1];
    calle = calle.replace(pisoMatch[0], "").trim();
  } else {
    // Probar formatos cortos como "P. 3" o "P:3" o "P 3" (debe ser un 'p' suelto)
    const pisoShortRegex = /\b(?:p\.|p:|p\b)\s*([a-z0-9-]+)\b/i;
    const pisoShortMatch = calle.match(pisoShortRegex);
    if (pisoShortMatch) {
      piso = pisoShortMatch[1];
      calle = calle.replace(pisoShortMatch[0], "").trim();
    }
  }

  // 2. Intentar emparejar y extraer formato "Dpto" o similar
  const deptoRegex = /\b(?:dpto|dpto\.|dept|dep|oficina|of\.?|dpto:)\s*([a-z0-9-]+)\b/i;
  const deptoMatch = calle.match(deptoRegex);
  if (deptoMatch) {
    departamento = deptoMatch[1];
    calle = calle.replace(deptoMatch[0], "").trim();
  } else {
    // Probar formatos cortos como "D. 3" o "D:3" o "D 3" (debe ser un 'd' suelto)
    const deptoShortRegex = /\b(?:d\.|d:|d\b)\s*([a-z0-9-]+)\b/i;
    const deptoShortMatch = calle.match(deptoShortRegex);
    if (deptoShortMatch) {
      departamento = deptoShortMatch[1];
      calle = calle.replace(deptoShortMatch[0], "").trim();
    }
  }

  // 3. Intentar emparejar y extraer Manzana/Lote, ej: "M:48" o "Mz:48"
  const manzanaRegex = /(?:m:|m\s|mz:|mz\s)\s*([a-z0-9-]+)/i;
  const manzanaMatch = calle.match(manzanaRegex);
  if (manzanaMatch) {
    departamento = (departamento ? departamento + " " : "") + manzanaMatch[0];
    calle = calle.replace(manzanaMatch[0], "").trim();
  }

  // 4. Intentar emparejar patrones combinados del final como "3 B" (piso y depto de 1 letra)
  const floorDeptRegex = /\s+(\d+)\s+([a-zA-Z])\s*$/;
  const floorDeptMatch = calle.match(floorDeptRegex);
  if (floorDeptMatch) {
    piso = floorDeptMatch[1];
    departamento = floorDeptMatch[2];
    calle = calle.replace(floorDeptMatch[0], "").trim();
  }

  // 5. Buscar el número al final de la calle restante
  const numRegex = /\s+(\d+)\s*$/;
  const numMatch = calle.match(numRegex);
  if (numMatch) {
    numero = parseInt(numMatch[1], 10) || 0;
    calle = calle.replace(numRegex, "").trim();
  } else {
    const numRegexAny = /(\d+)\s*$/;
    const numMatchAny = calle.match(numRegexAny);
    if (numMatchAny) {
      numero = parseInt(numMatchAny[1], 10) || 0;
      calle = calle.replace(numRegexAny, "").trim();
    }
  }

  // Limpiar caracteres sobrantes al principio y final
  calle = calle.replace(/^[\s,/-]+|[\s,/-]+$/g, "").trim();

  return {
    calle,
    numero,
    piso,
    departamento,
  };
};

/**
 * Utilidades para el mapeo de provincias entre el formato de AFIP y nuestro catálogo interno.
 *
 * El endpoint de AFIP retorna el campo `descripcionprovincia` con nombres completos y en
 * mayúsculas (ej. "CIUDAD AUTONOMA BUENOS AIRES"), mientras que nuestro catálogo puede
 * usar nombres distintos (ej. "CABA"). Este módulo provee un mapa de aliases y una función
 * de búsqueda robusta para resolver esas discrepancias.
 */

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

/**
 * Mapa de aliases: nombre AFIP normalizado → fragmento que debería estar en el label del catálogo.
 * Cubre variantes conocidas incluyendo acentos y nombres completos vs. abreviaturas.
 */
const AFIP_PROVINCIA_ALIASES = {
  "CIUDAD AUTONOMA BUENOS AIRES": ["CABA", "CAPITAL FEDERAL"],
  "CIUDAD AUTONOMA DE BUENOS AIRES": ["CABA", "CAPITAL FEDERAL"],
  "CAPITAL FEDERAL": ["CABA", "CAPITAL FEDERAL"],
  "BUENOS AIRES": ["BUENOS AIRES"],
  "CORDOBA": ["CORDOBA"],
  "SANTA FE": ["SANTA FE", "STA FE", "STA. FE"],
  "PROVINCIA DE SANTA FE": ["SANTA FE", "STA FE", "STA. FE"],
  "MENDOZA": ["MENDOZA"],
  "TUCUMAN": ["TUCUMAN"],
  "SALTA": ["SALTA"],
  "ENTRE RIOS": ["ENTRE RIOS"],
  "MISIONES": ["MISIONES"],
  "CHACO": ["CHACO"],
  "CORRIENTES": ["CORRIENTES"],
  "SANTIAGO DEL ESTERO": ["SANTIAGO DEL ESTERO", "SGO DEL ESTERO", "SGO. DEL ESTERO", "SDE"],
  "SAN JUAN": ["SAN JUAN"],
  "JUJUY": ["JUJUY"],
  "RIO NEGRO": ["RIO NEGRO"],
  "NEUQUEN": ["NEUQUEN"],
  "FORMOSA": ["FORMOSA"],
  "CHUBUT": ["CHUBUT"],
  "SAN LUIS": ["SAN LUIS"],
  "CATAMARCA": ["CATAMARCA"],
  "LA RIOJA": ["LA RIOJA"],
  "LA PAMPA": ["LA PAMPA"],
  "SANTA CRUZ": ["SANTA CRUZ", "STA CRUZ", "STA. CRUZ"],
  "TIERRA DEL FUEGO": ["TIERRA DEL FUEGO", "TDF"],
  "TIERRA DEL FUEGO ANTARTIDA E ISLAS DEL ATLANTICO SUR": ["TIERRA DEL FUEGO", "TDF"],
};

/**
 * Busca la opción de provincia en nuestro catálogo que mejor coincide
 * con el nombre de provincia retornado por AFIP.
 *
 * Estrategia de búsqueda (en orden de prioridad):
 *  1. Alias exacto en AFIP_PROVINCIA_ALIASES
 *  2. Coincidencia exacta de label normalizado
 *  3. Substring (cualquiera contiene al otro)
 *
 * @param {string} afipProvNombre - Valor de `descripcionprovincia` de AFIP
 * @param {Array<{value: string, label: string}>} opcionesProvincias - Opciones del catálogo
 * @returns {{ value: string, label: string } | null}
 */
export const matchProvinciaAfip = (afipProvNombre, opcionesProvincias) => {
  if (!afipProvNombre || !opcionesProvincias?.length) return null;
  const normAfip = normalizarTexto(afipProvNombre);

  // 1. Alias exacto
  const aliasTargets = AFIP_PROVINCIA_ALIASES[normAfip];
  if (aliasTargets) {
    const targets = Array.isArray(aliasTargets) ? aliasTargets : [aliasTargets];
    const match = opcionesProvincias.find((p) =>
      targets.some(target => normalizarTexto(p.label).includes(target))
    );
    if (match) return match;
  }

  // 2. Coincidencia exacta
  const exactMatch = opcionesProvincias.find(
    (p) => normalizarTexto(p.label) === normAfip
  );
  if (exactMatch) return exactMatch;

  // 3. Substring (fallback)
  return (
    opcionesProvincias.find(
      (p) =>
        normalizarTexto(p.label).includes(normAfip) ||
        normAfip.includes(normalizarTexto(p.label))
    ) || null
  );
};

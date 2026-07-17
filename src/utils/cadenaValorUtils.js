// Reglas de negocio para determinar si una cadena de valor (dato CORE) está
// operativa: debe estar Aprobada y dentro de su vigencia (VigenciaHasta no
// puede ser anterior a hoy; sin fecha de vencimiento se considera vigente).

const ESTADO_APROBADA = "aprobada";

const obtenerCampo = (obj, propName) => {
  if (!obj) return undefined;
  const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
  return obj[propName] !== undefined ? obj[propName] : obj[pascal];
};

export const esCadenaVigente = (vigenciaHasta) => {
  if (!vigenciaHasta) return true;
  const fechaVigencia = new Date(vigenciaHasta);
  if (Number.isNaN(fechaVigencia.getTime())) return true;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaVigencia.setHours(0, 0, 0, 0);
  return fechaVigencia >= hoy;
};

// cadenaCore: item devuelto por CadenaValor/ObtenerTodas/{cursaPlataforma}
export const esCadenaAprobadaYVigente = (cadenaCore) => {
  if (!cadenaCore) return false;
  const estado = String(obtenerCampo(cadenaCore, "estado") || "").trim().toLowerCase();
  const vigenciaHasta = obtenerCampo(cadenaCore, "vigenciahasta");
  return estado === ESTADO_APROBADA && esCadenaVigente(vigenciaHasta);
};

export const obtenerCadenaValorId = (obj) => obtenerCampo(obj, "cadenavalorid");

// Una cadena está operativa en la web cuando, además de estar Aprobada y
// vigente en CORE, el admin no la desactivó manualmente con el switch
// "Activa" de la tabla web (ese flag ahora es una restricción adicional que
// se puede usar para apagar una cadena aunque esté aprobada, no la única
// fuente de verdad).
export const esCadenaOperativaParaWeb = (cadenaWeb, cadenaCore) => {
  if (!esCadenaAprobadaYVigente(cadenaCore)) return false;
  const activaManual = obtenerCampo(cadenaWeb, "activa");
  return activaManual === undefined || activaManual === null || String(activaManual) !== "0";
};

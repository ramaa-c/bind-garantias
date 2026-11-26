import {
  TIPOS_DOCUMENTO_ARCHIVO,
  DOCUMENTO_DNI_FRENTE_ID,
  DOCUMENTO_DNI_DORSO_ID,
} from "../constants/tiposDocumentoArchivo";
import { RELACION_ACCIONISTA_ID } from "../constants/tiposRelacionSocio";

// Documentación por tipo de tercero (parametrización de terceros).
//
// La configuración viaja en la misma parametrización de la cadena
// (api/CadenaValorParametrizacion): una fila con TipoRelacionSocioID Y
// TipoDocumentoArchivoID a la vez significa "ese documento para ese tipo de
// tercero", con el mismo Requerimiento de siempre (1 obligatorio, 2
// opcional, 0 no se pide). requisitosService la deja en
// `requisitos.documentosTerceros[tipoRelacionSocioId][claveDocumento]`.
//
// Accionista pide DNI frente y dorso por defecto (como hasta ahora), aunque
// la cadena no tenga filas propias para eso; una fila explícita lo pisa.
export const DOCUMENTOS_TERCERO_POR_DEFECTO = {
  [RELACION_ACCIONISTA_ID]: { "socio-frente": 1, "socio-dorso": 1 },
};

export const REQUERIMIENTO_OBLIGATORIO = 1;
export const REQUERIMIENTO_OPCIONAL = 2;

const IDS_DNI = new Set([DOCUMENTO_DNI_FRENTE_ID, DOCUMENTO_DNI_DORSO_ID]);
export const esDocumentoDni = (tipoDocumentoId) => IDS_DNI.has(Number(tipoDocumentoId));

// El DNI siempre con este nombre (el catálogo lo llama distinto según el
// ambiente); el resto sale del catálogo (tituloDe) y esto es solo el
// respaldo si no respondió, para no mostrar la clave interna.
const TITULOS_DNI = {
  "socio-frente": "DNI frente",
  "socio-dorso": "DNI dorso",
};
const TITULOS_RESPALDO = {
  estatuto: "Estatuto social",
  balance: "Balance",
  ddjjIva: "DDJJ de IVA",
  cartasDocumento: "Cartas documento",
  poderes: "Poder",
  certificadoPyme: "Certificado PyME",
  otrosDocumentos: "Otros documentos",
  eecc: "Estados contables",
  actaDesignacion: "Acta de designación de autoridades",
  actaSocios: "Acta de socios",
  f1272: "Formulario 1272",
  ddjjGanancias: "DDJJ de Ganancias",
  manifestacionBienes: "Manifestación de bienes",
  constanciaMonotributo: "Constancia de monotributo",
};

// Orden: el DNI primero (frente, dorso), después los obligatorios y al final
// los opcionales, cada grupo en el orden del catálogo - así la modal y el
// chip "Falta:" se leen siempre igual.
const ORDEN_CLAVES = ["socio-frente", "socio-dorso", ...Object.keys(TIPOS_DOCUMENTO_ARCHIVO)];
const ordenDe = (clave) => {
  const i = ORDEN_CLAVES.indexOf(clave);
  return i === -1 ? ORDEN_CLAVES.length : i;
};

/**
 * Documentos que se le piden a un tipo de tercero, ya ordenados.
 * @returns {{clave: string, tipoDocumentoId: number, requerimiento: number}[]}
 */
export const documentosRequeridosDeTercero = (requisitos, tipoRelacionSocioId) => {
  const id = Number(tipoRelacionSocioId);
  const config = {
    ...(DOCUMENTOS_TERCERO_POR_DEFECTO[id] || {}),
    ...(requisitos?.documentosTerceros?.[id] || {}),
  };
  return Object.entries(config)
    .filter(([clave, req]) => TIPOS_DOCUMENTO_ARCHIVO[clave] && (req === 1 || req === 2))
    .map(([clave, req]) => ({
      clave,
      tipoDocumentoId: Number(TIPOS_DOCUMENTO_ARCHIVO[clave]),
      requerimiento: req,
    }))
    .sort(
      (a, b) =>
        Number(!esDocumentoDni(a.tipoDocumentoId)) - Number(!esDocumentoDni(b.tipoDocumentoId)) ||
        a.requerimiento - b.requerimiento ||
        ordenDe(a.clave) - ordenDe(b.clave),
    );
};

export const tituloDocumentoTercero = (clave, tituloDe) =>
  TITULOS_DNI[clave] || (tituloDe && tituloDe(clave)) || TITULOS_RESPALDO[clave] || clave;

const normalizar = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();

const soloDigitos = (valor) => String(valor || "").replace(/\D/g, "");

// Hasta que el backend sume el ID del tercero al archivo, el vínculo es la
// descripción. Los documentos que no son DNI llevan este prefijo para no
// confundirse con los de la empresa: un tipo como "DDJJ de Ganancias" puede
// ser de la empresa o de un fiador, y DocumentosLegajo/useValidacionLegajo
// los reconocen solo por el tipo. El DNI conserva su formato de siempre
// ("DNI Frente - <CUIT> - <NOMBRE>"): no es un documento de la empresa.
const PREFIJO_TERCERO = "TERCERO ";

export const esArchivoDeTercero = (archivo) => normalizar(archivo?.descripcion).startsWith(PREFIJO_TERCERO);

/** Archivos que son de la empresa (sin los documentos cargados a terceros). */
export const soloArchivosEmpresa = (archivos) =>
  (Array.isArray(archivos) ? archivos : []).filter((a) => !esArchivoDeTercero(a));

export const descripcionArchivoTercero = ({ clave, titulo, cuit, nombre }) => {
  const cuitLimpio = soloDigitos(cuit);
  const nombreMayus = String(nombre || "").toUpperCase();
  if (clave === "socio-frente") return `DNI Frente - ${cuitLimpio} - ${nombreMayus}`;
  if (clave === "socio-dorso") return `DNI Dorso - ${cuitLimpio} - ${nombreMayus}`;
  return `Tercero ${cuitLimpio} - ${titulo} - ${nombreMayus}`;
};

/** El archivo de un documento de una persona, o null. */
export const archivoDeTercero = (archivos, tipoDocumentoId, persona) => {
  const cuitLimpio = soloDigitos(persona?.cuit);
  const nombreNorm = normalizar(persona?.nombre);
  const id = Number(tipoDocumentoId);
  return (
    (Array.isArray(archivos) ? archivos : []).find((a) => {
      if (Number(a.tipodocumentoarchivoid) !== id) return false;
      const desc = normalizar(a.descripcion);
      if (esDocumentoDni(id)) {
        // Mismo criterio que tenía el DNI de accionistas: CUIT o nombre.
        return (cuitLimpio && desc.includes(cuitLimpio)) || (nombreNorm && desc.includes(nombreNorm));
      }
      return desc.startsWith(PREFIJO_TERCERO) && !!cuitLimpio && desc.includes(cuitLimpio);
    }) || null
  );
};

/**
 * Estado de la documentación de una persona para su tipo de relación.
 * `faltantes` son los títulos de los obligatorios sin cargar.
 */
export const estadoDocumentacionTercero = ({ requeridos, archivos, persona, tituloDe }) => {
  const items = requeridos.map((req) => ({
    ...req,
    titulo: tituloDocumentoTercero(req.clave, tituloDe),
    archivo: archivoDeTercero(archivos, req.tipoDocumentoId, persona),
  }));
  const cargados = items.filter((i) => i.archivo).length;
  const faltantes = items
    .filter((i) => !i.archivo && i.requerimiento === REQUERIMIENTO_OBLIGATORIO)
    .map((i) => i.titulo);
  return { items, total: items.length, cargados, faltantes };
};

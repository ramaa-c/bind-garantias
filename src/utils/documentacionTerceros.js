import {
  TIPOS_DOCUMENTO_ARCHIVO,
  DOCUMENTO_DNI_FRENTE_ID,
  DOCUMENTO_DNI_DORSO_ID,
} from "../constants/tiposDocumentoArchivo";
import { RELACION_ACCIONISTA_ID } from "../constants/tiposRelacionSocio";

export const REQUERIMIENTO_OBLIGATORIO = 1;
export const REQUERIMIENTO_OPCIONAL = 2;

export const CONFIGURACION_DOCUMENTOS_POR_DEFECTO = {
  [RELACION_ACCIONISTA_ID]: {
    [DOCUMENTO_DNI_FRENTE_ID]: REQUERIMIENTO_OBLIGATORIO,
    [DOCUMENTO_DNI_DORSO_ID]: REQUERIMIENTO_OBLIGATORIO,
  },
};

const IDS_DNI = new Set([DOCUMENTO_DNI_FRENTE_ID, DOCUMENTO_DNI_DORSO_ID]);
export const esDocumentoDni = (tipoDocumentoId) => IDS_DNI.has(Number(tipoDocumentoId));

const CLAVE_POR_ID_DOCUMENTO = Object.fromEntries(
  Object.entries(TIPOS_DOCUMENTO_ARCHIVO).map(([clave, id]) => [Number(id), clave]),
);
const claveDeDocumento = (tipoDocumentoId) =>
  CLAVE_POR_ID_DOCUMENTO[Number(tipoDocumentoId)] || `doc-${Number(tipoDocumentoId)}`;

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

const ORDEN_CLAVES = ["socio-frente", "socio-dorso", ...Object.keys(TIPOS_DOCUMENTO_ARCHIVO)];
const ordenDe = (clave) => {
  const i = ORDEN_CLAVES.indexOf(clave);
  return i === -1 ? ORDEN_CLAVES.length : i;
};

const esPedido = (req) => req === REQUERIMIENTO_OBLIGATORIO || req === REQUERIMIENTO_OPCIONAL;

export const armarConfiguracionDocumentos = (filas) =>
  (Array.isArray(filas) ? filas : []).reduce((config, fila) => {
    const relId = Number(fila?.tiporelacionsocioid);
    const docId = Number(fila?.tipodocumentoarchivoid);
    if (!relId || !docId) return config;
    config[relId] = { ...config[relId], [docId]: Number(fila?.requerimiento) || 0 };
    return config;
  }, {});

export const documentosRequeridosDeTercero = (configuracion, tipoRelacionSocioId) =>
  Object.entries(configuracion?.[Number(tipoRelacionSocioId)] || {})
    .filter(([, req]) => esPedido(req))
    .map(([docId, req]) => ({
      clave: claveDeDocumento(docId),
      tipoDocumentoId: Number(docId),
      requerimiento: req,
    }))
    .sort(
      (a, b) =>
        Number(!esDocumentoDni(a.tipoDocumentoId)) - Number(!esDocumentoDni(b.tipoDocumentoId)) ||
        a.requerimiento - b.requerimiento ||
        ordenDe(a.clave) - ordenDe(b.clave) ||
        a.tipoDocumentoId - b.tipoDocumentoId,
    );

export const requerimientoDe = (requeridos, clave) =>
  requeridos.find((r) => r.clave === clave)?.requerimiento ?? 0;

export const tituloDocumentoTercero = (clave, tituloDe, tipoDocumentoId) =>
  TITULOS_DNI[clave] ||
  (tituloDe && tipoDocumentoId && tituloDe(Number(tipoDocumentoId))) ||
  TITULOS_RESPALDO[clave] ||
  `Documento #${tipoDocumentoId}`;

const normalizar = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();

const soloDigitos = (valor) => String(valor || "").replace(/\D/g, "");

const PREFIJO_TERCERO = "TERCERO ";

const terceroIdDeArchivo = (archivo) => Number(archivo?.terceroid) || 0;
const sinColumnaTercero = (archivo) => !!archivo && !("terceroid" in archivo);

export const esArchivoDeTercero = (archivo) =>
  terceroIdDeArchivo(archivo) > 0 || normalizar(archivo?.descripcion).startsWith(PREFIJO_TERCERO);

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

const coincidePorDescripcion = (archivo, tipoDocumentoId, persona) => {
  const cuitLimpio = soloDigitos(persona?.cuit);
  const nombreNorm = normalizar(persona?.nombre);
  const desc = normalizar(archivo.descripcion);
  if (esDocumentoDni(tipoDocumentoId)) {
    return (!!cuitLimpio && desc.includes(cuitLimpio)) || (!!nombreNorm && desc.includes(nombreNorm));
  }
  return desc.startsWith(PREFIJO_TERCERO) && !!cuitLimpio && desc.includes(cuitLimpio);
};

export const archivoDeTercero = (archivos, tipoDocumentoId, persona) => {
  const id = Number(tipoDocumentoId);
  const terceroId = Number(persona?.id) || 0;
  return (
    (Array.isArray(archivos) ? archivos : []).find((a) => {
      if (Number(a.tipodocumentoarchivoid) !== id) return false;
      if (sinColumnaTercero(a)) return coincidePorDescripcion(a, id, persona);
      return terceroId > 0 && terceroIdDeArchivo(a) === terceroId;
    }) || null
  );
};

/**
 * Estado de la documentación de una persona. `faltantes` son los títulos de
 * los obligatorios sin cargar.
 */
export const estadoDocumentacionTercero = ({ requeridos, archivos, persona, tituloDe }) => {
  const items = requeridos.map((req) => ({
    ...req,
    titulo: tituloDocumentoTercero(req.clave, tituloDe, req.tipoDocumentoId),
    archivo: archivoDeTercero(archivos, req.tipoDocumentoId, persona),
  }));
  const cargados = items.filter((i) => i.archivo).length;
  const faltantes = items
    .filter((i) => !i.archivo && i.requerimiento === REQUERIMIENTO_OBLIGATORIO)
    .map((i) => i.titulo);
  return { items, total: items.length, cargados, faltantes };
};

export const mensajeFaltaDocumento = (documento, nombre) => `Falta ${documento} de ${nombre}`;

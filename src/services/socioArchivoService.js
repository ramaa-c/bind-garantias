import api from "../api/axios";

/**
 * Convierte un File del navegador a string base64 (sin el prefijo data:...).
 */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result es "data:application/pdf;base64,XXXX..."
      const base64 = reader.result.split(",")[1] || reader.result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Formatea una fecha JS al formato requerido "2026-01-01T00:00:00"
 */
const formatFechaArchivo = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Mapeo de claves de documento a tipodocumentoarchivoid.
 * Estos IDs deben coincidir con los del backend.
 * Si el backend usa otros valores, actualizar acá.
 */
const TIPO_DOCUMENTO_MAP = {
  // Documentos de empresa (Paso5 / ModalDocumentosEmpresa)
  estatuto: 1,
  balance: 2,
  acta: 3,
  poderes: 4,
  // Documentos del legajo (DocumentosLegajo)
  certificadoPyme: 5,
  otrosDocumentos: 6,
  // Documentos de socios (DNI frente/dorso)
  "socio-frente": 7,
  "socio-dorso": 8,
};

/**
 * Obtiene el tipodocumentoarchivoid para una clave dada.
 * Si la clave es dinámica (ej: "socio-3-frente"), extrae el sufijo.
 */
const getTipoDocumentoId = (key) => {
  if (TIPO_DOCUMENTO_MAP[key]) return TIPO_DOCUMENTO_MAP[key];
  // Claves dinámicas para socios: "socio-{index}-frente" / "socio-{index}-dorso"
  if (key.includes("frente")) return TIPO_DOCUMENTO_MAP["socio-frente"];
  if (key.includes("dorso")) return TIPO_DOCUMENTO_MAP["socio-dorso"];
  return 0;
};

export const socioArchivoService = {
  /**
   * GET /api/SocioArchivo?socioid={socioId}
   * Obtiene todos los archivos de un socio.
   */
  obtenerArchivos: async (socioId) => {
    try {
      const response = await api.get("api/SocioArchivo", {
        params: { socioid: socioId },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * GET /api/SocioArchivo/{socioArchivoId}
   * Obtiene un archivo específico por su ID.
   */
  obtenerArchivoPorId: async (socioArchivoId) => {
    const response = await api.get(`api/SocioArchivo/${socioArchivoId}`);
    return response.data;
  },

  /**
   * POST /api/SocioArchivo
   * Sube un archivo nuevo para un socio.
   * @param {number} socioId - ID del socio
   * @param {File} file - Archivo del navegador
   * @param {string} docKey - Clave del tipo de documento (ej: "estatuto", "balance")
   * @param {string} descripcion - Descripción opcional
   */
  subirArchivo: async (socioId, file, docKey, descripcion = "") => {
    const contenidoBase64 = await fileToBase64(file);

    const payload = {
      socioarchivoid: 0,
      socioid: socioId,
      fcharchivo: formatFechaArchivo(),
      descripcion: descripcion || docKey || file.name,
      contenido: contenidoBase64,
      nombrearchivo: file.name,
      tipodocumentoarchivoid: getTipoDocumentoId(docKey),
      azureid: 0,
    };

    console.log(`📤 POST SocioArchivo [${docKey}]:`, {
      ...payload,
      contenido: `(base64, ${contenidoBase64.length} chars)`,
    });

    const response = await api.post("api/SocioArchivo", payload);
    console.log(`📥 Respuesta SocioArchivo [${docKey}]:`, response.data);
    return response.data;
  },

  /**
   * PUT /api/SocioArchivo
   * Actualiza un archivo existente.
   * @param {object} archivoExistente - Datos del archivo existente (con socioarchivoid)
   * @param {File} file - Nuevo archivo
   * @param {string} docKey - Clave del tipo de documento
   * @param {string} descripcion - Descripción opcional
   */
  actualizarArchivo: async (archivoExistente, file, docKey, descripcion = "") => {
    const contenidoBase64 = await fileToBase64(file);

    const payload = {
      ...archivoExistente,
      fcharchivo: formatFechaArchivo(),
      descripcion: descripcion || docKey || file.name,
      contenido: contenidoBase64,
      nombrearchivo: file.name,
      tipodocumentoarchivoid: getTipoDocumentoId(docKey),
    };

    console.log(`📤 PUT SocioArchivo [${docKey}]:`, {
      ...payload,
      contenido: `(base64, ${contenidoBase64.length} chars)`,
    });

    const response = await api.put("api/SocioArchivo", payload);
    console.log(`📥 Respuesta PUT SocioArchivo [${docKey}]:`, response.data);
    return response.data;
  },

  /**
   * Sube o actualiza un archivo inteligentemente.
   * Si ya existe un archivo con el mismo tipodocumentoarchivoid, hace PUT. Si no, POST.
   * @param {number} socioId
   * @param {File} file
   * @param {string} docKey
   * @param {Array} archivosExistentes - Lista de archivos ya cargados del backend
   * @param {string} descripcion
   */
  subirOActualizar: async (socioId, file, docKey, archivosExistentes = [], descripcion = "") => {
    const tipoId = getTipoDocumentoId(docKey);
    const existente = archivosExistentes.find(
      (a) => a.tipodocumentoarchivoid === tipoId
    );

    if (existente) {
      return socioArchivoService.actualizarArchivo(existente, file, docKey, descripcion);
    } else {
      return socioArchivoService.subirArchivo(socioId, file, docKey, descripcion);
    }
  },

  // Utilidades exportadas
  fileToBase64,
  formatFechaArchivo,
  getTipoDocumentoId,
  TIPO_DOCUMENTO_MAP,
};

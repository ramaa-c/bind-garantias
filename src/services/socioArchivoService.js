import api from "../api/axios";

/**   Convierte un File del navegador a string base64   */
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

/**  Formatea una fecha JS al formato requerido "2026-01-01T00:00:00"   */
const formatFechaArchivo = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const TIPO_DOCUMENTO_MAP = {
  // Documentos de empresa (Paso5 / DocumentosEmpresaModal)
  estatuto: 1,
  balance: 2,
  acta: 3,
  cartasDocumento: 4,
  poderes: 5,
  // Documentos del legajo (DocumentosLegajo)
  certificadoPyme: 6,
  otrosDocumentos: 7,
  // Documentos de socios (DNI frente/dorso)
  "socio-frente": 8,
  "socio-dorso": 9,
};

/**   Obtiene el tipodocumentoarchivoid para una clave dada.   */
const getTipoDocumentoId = (key) => {
  if (TIPO_DOCUMENTO_MAP[key]) return TIPO_DOCUMENTO_MAP[key];
  if (key.includes("frente")) return TIPO_DOCUMENTO_MAP["socio-frente"];
  if (key.includes("dorso")) return TIPO_DOCUMENTO_MAP["socio-dorso"];
  return 0;
};

export const socioArchivoService = {
  /**   Obtiene todos los archivos de un socio   */
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

    const response = await api.post("api/SocioArchivo", payload);
    return response.data;
  },

  actualizarArchivo: async (
    archivoExistente,
    file,
    docKey,
    descripcion = "",
  ) => {
    const contenidoBase64 = await fileToBase64(file);

    const payload = {
      ...archivoExistente,
      fcharchivo: formatFechaArchivo(),
      descripcion: descripcion || docKey || file.name,
      contenido: contenidoBase64,
      nombrearchivo: file.name,
      tipodocumentoarchivoid: getTipoDocumentoId(docKey),
    };

    console.log(` PUT SocioArchivo [${docKey}]:`, {
      ...payload,
      contenido: `(base64, ${contenidoBase64.length} chars)`,
    });

    const response = await api.put("api/SocioArchivo", payload);
    return response.data;
  },

  subirOActualizar: async (
    socioId,
    file,
    docKey,
    archivosExistentes = [],
    descripcion = "",
    specificId = null,
  ) => {
    const tipoId = getTipoDocumentoId(docKey);
    const existente = specificId
      ? archivosExistentes.find(
          (a) => (a.socioarchivoid || a.id) === Number(specificId),
        )
      : archivosExistentes.find(
          (a) => a.tipodocumentoarchivoid === tipoId,
        );

    if (existente) {
      return socioArchivoService.actualizarArchivo(
        existente,
        file,
        docKey,
        descripcion,
      );
    } else {
      return socioArchivoService.subirArchivo(
        socioId,
        file,
        docKey,
        descripcion,
      );
    }
  },

  fileToBase64,
  formatFechaArchivo,
  getTipoDocumentoId,
  TIPO_DOCUMENTO_MAP,
};

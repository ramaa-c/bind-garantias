import { modeloDocumentoAdapter } from "../adapters/modeloDocumentoAdapter";
import api from "../api/axios";

const TIMEOUT_GENERAR_PDF_MS = 60000;

export const modeloDocumentoService = {
  // POST /api/ModeloDocumentoPDF - Devuelve el PDF generado como Blob.
  //
  // El backend responde con Content-Type: application/pdf incluso cuando
  // falla (ej: 400 "El documento no pudo construirse..." cuando al socio le
  // falta el apoderado/fiador que el modelo necesita), así que no alcanza
  // con mirar el header: hay que leer el body y chequear la firma %PDF.
  // noRetry porque reintentar una generación que falló por datos faltantes
  // no cambia el resultado.
  generarPDF: async (data) => {
    const payload = modeloDocumentoAdapter.adaptarPayloadGenerarPDF(data);

    try {
      const response = await api.post("api/ModeloDocumentoPDF", payload, {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
        timeout: TIMEOUT_GENERAR_PDF_MS,
        noRetry: true,
      });
      return response.data;
    } catch (error) {
      const blob = error.response?.data;
      if (blob instanceof Blob) {
        const mensaje = (await blob.text()).trim();
        throw new Error(mensaje || "No se pudo generar el documento");
      }
      throw error;
    }
  },
};

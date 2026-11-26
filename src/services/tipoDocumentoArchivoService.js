import api from "../api/axios";
import { tipoDocumentoArchivoAdapter } from "../adapters/tipoDocumentoArchivoAdapter";

const ENDPOINT = "api/TipoDocumentoArchivo";

export const tipoDocumentoArchivoService = {
  obtenerActivos: async () => (await api.get(ENDPOINT)).data,

  crear: async (data) => (await api.post(ENDPOINT, tipoDocumentoArchivoAdapter.adaptarAlta(data))).data,

  actualizar: async (data) => (await api.put(ENDPOINT, tipoDocumentoArchivoAdapter.adaptarEdicion(data))).data,
};

export default tipoDocumentoArchivoService;

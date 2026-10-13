import api from "../api/axios";
import { conCacheCuit } from "../utils/cacheConsultasCuit";

export const afipService = {
  // GET api/afip/constanciainscripcion/{Value}
  obtenerConstanciaInscripcion: (cuit) =>
    conCacheCuit("afip", cuit, async () => {
      try {
        const cuitLimpio = String(cuit).replace(/\D/g, "");

        const response = await api.get(
          `api/afip/constanciainscripcion/${cuitLimpio}`,
          {
            timeout: 5000,
            noRetry: true,
          }
        );
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return null;
        }
        throw error;
      }
    }),
};

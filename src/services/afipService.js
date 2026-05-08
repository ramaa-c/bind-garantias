import api from "../api/axios";

export const afipService = {
  // GET api/afip/constanciainscripcion/{Value}
  obtenerConstanciaInscripcion: async (cuit) => {
    try {
      const cuitLimpio = String(cuit).replace(/\D/g, "");

      const response = await api.get(
        `api/afip/constanciainscripcion/${cuitLimpio}`,
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

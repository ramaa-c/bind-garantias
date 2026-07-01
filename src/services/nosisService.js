import api from "../api/axios";

export const nosisService = {
  obtenerVariables: async (cuit) => {
    try {
      const cuitLimpio = String(cuit).replace(/\D/g, "");
      const response = await api.get(`api/nosis/${cuitLimpio}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

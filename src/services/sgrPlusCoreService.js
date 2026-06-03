import api from "../api/axios";

export const sgrPlusCoreService = {
  validarUtilizacion: async (cuit) => {
    try {
      const response = await api.get(`SGRPlusCore/ValidarUtilizacion/${cuit}`);
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  },

  validarSocio: async (cuit, cadenaValorId) => {
    try {
      const response = await api.get(`SGRPlusCore/ValidarSocio/${cuit}/${cadenaValorId}`);
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  }
};

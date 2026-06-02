import api from "../api/axios";

export const sgrPlusCoreService = {
  validarUtilizacion: async (socioId) => {
    try {
      const response = await api.get(`SGRPlusCore/ValidarUtilizacion/${socioId}`);
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  },

  validarSocio: async (socioId, cadenaValorId) => {
    try {
      const response = await api.get(`SGRPlusCore/ValidarSocio/${socioId}/${cadenaValorId}`);
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  }
};

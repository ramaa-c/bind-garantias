import api from "../api/axios";

export const posicionConsolidadaService = {
  obtenerContragarantiaSocio: async (socioId) => {
    const response = await api.get(`PosicionConsolidada/ObtenerContragarantiaSocio/${socioId}`);
    return response.data;
  },
  obtenerLimiteSocio: async (socioId) => {
    const response = await api.get(`PosicionConsolidada/ObtenerLimiteSocio/${socioId}`);
    return response.data;
  }
};

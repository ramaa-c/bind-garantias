import api from "../api/axios";

const cuitCache = new Map();
const cuitWebCache = new Map();

export const sociosService = {
  // Trae lista de socios (SGRPlus)
  obtenerSocios: async (params = {}) => {
    // Si la búsqueda es primariamente por CUIT (aunque traiga página)
    const isCuitSearch = Boolean(params.Cuit);
    const cacheKey = isCuitSearch ? String(params.Cuit).trim() : null;

    if (isCuitSearch && cuitCache.has(cacheKey)) {
      return JSON.parse(JSON.stringify(cuitCache.get(cacheKey)));
    }

    try {
      const response = await api.get("sgrplus/Socios", { params });
      if (isCuitSearch && response.data) {
        cuitCache.set(cacheKey, JSON.parse(JSON.stringify(response.data)));
      }
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Trae lista de socios (Esquema Web / Legacy)
  obtenerSociosWeb: async (params = {}) => {
    const isCuitSearch = Boolean(params.Cuit);
    const cacheKey = isCuitSearch ? String(params.Cuit).trim() : null;

    if (isCuitSearch && cuitWebCache.has(cacheKey)) {
      return JSON.parse(JSON.stringify(cuitWebCache.get(cacheKey)));
    }

    try {
      const response = await api.get("api/Socios", { params });
      if (isCuitSearch && response.data) {
        cuitWebCache.set(cacheKey, JSON.parse(JSON.stringify(response.data)));
      }
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Trae un socio por ID (SGRPlus)
  obtenerSocioPorId: async (socioId) => {
    const response = await api.get(`sgrplus/Socio/${socioId}`);
    return response.data;
  },

  // Crea nuevo socio
  crearSocio: async (socioData) => {
    const response = await api.post("sgrplus/Socio", socioData);
    return response.data;
  },

  // Actualiza un socio
  actualizarSocio: async (socioData) => {
    const response = await api.put("sgrplus/Socio", socioData);
    return response.data;
  },
};

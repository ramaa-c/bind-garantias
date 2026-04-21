import api from "../api/axios";

export const sociosService = {
  // Trae lista de socios
  obtenerSocios: async (params = {}) => {
    const response = await api.get("/api/Socios", { params });
    return response.data;
  },

  // Trae un socio por ID
  obtenerSocioPorId: async (socioId) => {
    const response = await api.get(`/api/Socio/${socioId}`);
    return response.data;
  },

  // Crea nuevo socio
  crearSocio: async (socioData) => {
    const response = await api.post("/api/Socio", socioData);
    return response.data;
  },

  // Actualiza un socio
  actualizarSocio: async (socioData) => {
    const response = await api.put("/api/Socio", socioData);
    return response.data;
  },
};

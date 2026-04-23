import api from "../api/axios";

export const sociosService = {
  // Trae lista de socios (SGRPlus)
  obtenerSocios: async (params = {}) => {
    const response = await api.get("/sgrplus/Socios", { params });
    return response.data;
  },

  // Trae un socio por ID (SGRPlus)
  obtenerSocioPorId: async (socioId) => {
    const response = await api.get(`/sgrplus/Socio/${socioId}`);
    return response.data;
  },

  // Crea nuevo socio
  crearSocio: async (socioData) => {
    const response = await api.post("/sgrplus/Socio", socioData);
    return response.data;
  },

  // Actualiza un socio
  actualizarSocio: async (socioData) => {
    const response = await api.put("/sgrplus/Socio", socioData);
    return response.data;
  },
};

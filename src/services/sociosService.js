import api from '../api/axios';

export const sociosService = {
  // Trae lista de socios
  obtenerSocios: async (params = {}) => {
    const response = await api.get('/Socios', { params });
    return response.data;
  },

  // Trae un socio por ID
  obtenerSocioPorId: async (socioId) => {
    const response = await api.get(`/Socio/${socioId}`);
    return response.data;
  },

  // Crea nuevo socio
  crearSocio: async (socioData) => {
    const response = await api.post('/Socio', socioData);
    return response.data;
  }
};
import api from '../api/axios';

export const sociosService = {
  // Trae lista de socios
  obtenerSocios: async (params = {}) => (await api.get('/api/Socios', { params })).data,

  // Trae un socio por ID
  obtenerSocioPorId: async (socioId) => (await api.get(`/api/Socio/${socioId}`)).data,

  // Crea nuevo socio
  crearSocio: async (socioData) => (await api.post('/api/Socio', socioData)).data
};
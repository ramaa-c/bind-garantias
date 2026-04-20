import api from './axios';

export const tipoLimiteSocioService = {
    // GET /api/TipoLimiteSocioCambioEstado/{TipoLimiteSocioID}
    obtenerCambiosEstado: async (tipoLimiteSocioId) => (await api.get(`/api/TipoLimiteSocioCambioEstado/${tipoLimiteSocioId}`)).data,

    // GET /api/TipoLimiteSocio/{SocioID}
    obtenerLimitesPorSocio: async (socioId) => (await api.get(`/api/TipoLimiteSocio/${socioId}`)).data
};
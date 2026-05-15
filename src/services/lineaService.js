import api from '../api/axios';

export const lineaService = {
    // GET /sgrplus/TipoLimiteSocioCambioEstado/{TipoLimiteSocioID}
    obtenerCambiosEstado: async (tipoLimiteSocioId) => (await api.get(`sgrplus/TipoLimiteSocioCambioEstado/${tipoLimiteSocioId}`)).data,

    // GET /sgrplus/TipoLimiteSocio/{SocioID}
    obtenerLimitesPorSocio: async (socioId) => (await api.get(`/sgrplus/TipoLimiteSocio?socioid=${socioId}`)).data,

    // POST /sgrplus/TipoLimiteSocio
    crearLimiteSocio: async (limiteData) => (await api.post(`sgrplus/TipoLimiteSocio`, limiteData)).data
};
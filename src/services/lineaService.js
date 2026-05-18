import api from '../api/axios';

export const lineaService = {
    // GET api/TipoLimiteSocioCambioEstado/{TipoLimiteSocioID}
    obtenerCambiosEstado: async (tipoLimiteSocioId) => (await api.get(`api/TipoLimiteSocioCambioEstado/${tipoLimiteSocioId}`)).data,

    // GET api/TipoLimiteSocio?socioid={SocioID}
    obtenerLimitesPorSocio: async (socioId) => (await api.get(`api/TipoLimiteSocio?socioid=${socioId}`)).data,

    // POST api/TipoLimiteSocio
    crearLimiteSocio: async (limiteData) => (await api.post(`api/TipoLimiteSocio`, limiteData)).data
};
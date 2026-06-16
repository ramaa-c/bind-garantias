import api from '../api/axios';

export const lineaService = {
    // GET api/TipoLimiteSocioCambioEstado/{TipoLimiteSocioID}
    obtenerCambiosEstado: async (tipoLimiteSocioId) => (await api.get(`api/TipoLimiteSocioCambioEstado/${tipoLimiteSocioId}`)).data,

    // GET api/TipoLimiteSocio?socioid={SocioID}
    obtenerLimitesPorSocio: async (socioId) => (await api.get(`api/TipoLimiteSocio?socioid=${socioId}`)).data,

    // POST api/TipoLimiteSocio
    crearLimiteSocio: async (limiteData) => (await api.post(`api/TipoLimiteSocio`, limiteData)).data,

    // GET api/TipoLimiteCadenaValor?cadenavalorid={id}
    obtenerLimitesCadenaValor: async (cadenavalorid) => 
        (await api.get('api/TipoLimiteCadenaValor', { params: { cadenavalorid } })).data,

    // POST api/TipoLimiteCadenaValor
    crearLimiteCadenaValor: async (limiteData) => 
        (await api.post('api/TipoLimiteCadenaValor', limiteData)).data,

    // PUT api/TipoLimiteCadenaValor
    actualizarLimiteCadenaValor: async (limiteData) => 
        (await api.put('api/TipoLimiteCadenaValor', limiteData)).data,

    // DELETE api/TipoLimiteCadenaValor/{id}
    eliminarLimiteCadenaValor: async (id) => 
        (await api.delete(`api/TipoLimiteCadenaValor/${id}`)).data,

    // GET api/TipoObligacionTipoLimite?tipolimiteid={id}
    obtenerProductosPorLimite: async (tipolimiteid) => 
        (await api.get('api/TipoObligacionTipoLimite', { params: { tipolimiteid } })).data,

    // POST api/TipoObligacionTipoLimite
    asociarProductoLimite: async (asocData) => 
        (await api.post('api/TipoObligacionTipoLimite', asocData)).data,

    // DELETE api/TipoObligacionTipoLimite/{id}
    desasociarProductoLimite: async (id) => 
        (await api.delete(`api/TipoObligacionTipoLimite/${id}`)).data
};
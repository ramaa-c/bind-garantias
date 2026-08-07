import api from '../api/axios';

export const contratoService = {
    // GET /sgrplus/ContratoEstado
    obtenerEstadosContrato: async () => (await api.get('sgrplus/ContratoEstado')).data,

    // GET /sgrplus/Contrato/{SocioID}
    obtenerContratosPorSocio: async (socioId) => (await api.get(`sgrplus/Contrato/${socioId}`)).data
};
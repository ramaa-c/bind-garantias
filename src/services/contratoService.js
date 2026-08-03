import api from '../api/axios';

export const contratoService = {
    // GET /api/ContratoEstado
    obtenerEstadosContrato: async () => (await api.get('api/ContratoEstado')).data,

    // GET /api/Contrato/{SocioID}
    obtenerContratosPorSocio: async (socioId) => (await api.get(`api/Contrato/${socioId}`)).data
};
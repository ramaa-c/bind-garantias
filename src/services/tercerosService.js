import api from '../api/axios';

export const tercerosService = {
  //------ TERCERO RELACIONADO --------

  // Lista de terceros
  obtenerTerceros: async (params = {}) => (await api.get("api/TerceroRelacionado", { params })).data,

  // Tercero puntual por ID
  obtenerTerceroPorId: async (terceroId) => (await api.get(`api/TerceroRelacionado/${terceroId}`)).data,

  // Crea nuevo tercero relacionado
  crearTercero: async (terceroData) => (await api.post("api/TerceroRelacionado", terceroData)).data,

  // Trae los tipos de relación que tiene este tercero
  obtenerTiposHabilitados: async (terceroId) => (await api.get(`api/TerceroTipoHabilitado/${terceroId}`)).data,

  // Actualiza un tercero relacionado
  actualizarTercero: async (terceroData) => {
    const response = await api.put("TerceroRelacionado", terceroData);
    return response.data;
  },

  //------- SOCIO - TERCERO RELACIÓN ---------

  // Trae todas las relaciones que tiene un socio
  obtenerRelacionesDeSocio: async (socioId) => (await api.get(`api/SocioTerceroRelacion/${socioId}`)).data,

  // Guarda las relaciones de un socio
  guardarRelacionesDeSocio: async (relacionData) => {
    const response = await api.post("SocioTerceroRelacion", relacionData);
    return response.data;
  },

  // Actualiza una relación de socio
  actualizarRelacionDeSocio: async (relacionData) => {
    const response = await api.put("SocioTerceroRelacion", relacionData);
    return response.data;
  },
};

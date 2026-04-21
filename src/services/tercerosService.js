import api from "../api/axios";

export const tercerosService = {
  //------ TERCERO RELACIONADO --------

  // Lista de terceros
  obtenerTerceros: async (params = {}) => {
    const response = await api.get("/TerceroRelacionado", { params });
    return response.data;
  },

  // Tercero puntual por ID
  obtenerTerceroPorId: async (terceroId) => {
    const response = await api.get(`/TerceroRelacionado/${terceroId}`);
    return response.data;
  },

  // Crea nuevo tercero relacionado
  crearTercero: async (terceroData) => {
    const response = await api.post("/TerceroRelacionado", terceroData);
    return response.data;
  },

  // Trae los tipos de relación que tiene este tercero
  obtenerTiposHabilitados: async (terceroId) => {
    const response = await api.get(`/TerceroTipoHabilitado/${terceroId}`);
    return response.data;
  },

  // Actualiza un tercero relacionado
  actualizarTercero: async (terceroData) => {
    const response = await api.put("/TerceroRelacionado", terceroData);
    return response.data;
  },

  //------- SOCIO - TERCERO RELACIÓN ---------

  // Trae todas las relaciones que tiene un socio
  obtenerRelacionesDeSocio: async (socioId) => {
    const response = await api.get(`/SocioTerceroRelacion/${socioId}`);
    return response.data;
  },

  // Guarda las relaciones de un socio
  guardarRelacionesDeSocio: async (relacionData) => {
    const response = await api.post("/SocioTerceroRelacion", relacionData);
    return response.data;
  },

  // Actualiza una relación de socio
  actualizarRelacionDeSocio: async (relacionData) => {
    const response = await api.put("/SocioTerceroRelacion", relacionData);
    return response.data;
  },
};

import api from "../api/axios";

const sanitizarRelacion = (relacionData) => {
  if (!relacionData || typeof relacionData !== "object") return relacionData;

  const validKeys = [
    "sociotercerorelacionid",
    "socioid",
    "terceroid",
    "tiporelacionsocioid",
    "fechadesde",
    "fechahasta",
    "porcacciones",
    "nroinscripcion",
    "condicionescomerciales",
    "cbu",
    "provinciaid",
    "nrosubcuentacaja",
    "sucursalid",
    "default",
    "subtiporelacionsocioid",
    "telefono",
    "momento",
  ];

  const cleanData = {};
  for (const key of Object.keys(relacionData)) {
    const lowerKey = key.toLowerCase();
    if (validKeys.includes(lowerKey)) {
      const val = relacionData[key];
      // Keep only scalar values (number, string, boolean, null)
      if (val === null || typeof val !== "object") {
        cleanData[lowerKey] = val;
      }
    }
  }
  return cleanData;
};

export const tercerosService = {
  //------ TERCERO RELACIONADO --------

  // Lista de terceros
  obtenerTerceros: async (params = {}) =>
    (await api.get("api/TerceroRelacionado", { params })).data,

  // Tercero puntual por ID
  obtenerTerceroPorId: async (terceroId) =>
    (await api.get(`api/TerceroRelacionado/${terceroId}`)).data,

  // Crea nuevo tercero relacionado
  crearTercero: async (terceroData) =>
    (await api.post("api/TerceroRelacionado", terceroData)).data,

  // Actualiza un tercero relacionado
  actualizarTercero: async (terceroData) => {
    const response = await api.put("api/TerceroRelacionado", terceroData);
    return response.data;
  },

  // Trae los tipos de relación que tiene este tercero
  obtenerTiposHabilitados: async (terceroId) =>
    (await api.get(`sgrplus/TerceroTipoHabilitado/${terceroId}`)).data,

  //------- SOCIO - TERCERO RELACIÓN ---------

  // Trae todas las relaciones que tiene un socio
  obtenerRelacionesDeSocio: async (socioId) =>
    (await api.get(`api/SocioTerceroRelacion/${socioId}`)).data,

  // Guarda las relaciones de un socio
  guardarRelacionesDeSocio: async (relacionData) => {
    const response = await api.post("api/SocioTerceroRelacion", relacionData);
    return response.data;
  },

  // Actualiza una relación de socio
  actualizarRelacionDeSocio: async (relacionData) => {
    const cleanData = sanitizarRelacion(relacionData);
    const socioId =
      cleanData.socioid ||
      cleanData.socioId ||
      cleanData.SocioID ||
      relacionData.socioid ||
      relacionData.socioId ||
      relacionData.SocioID;

    const wrappedData = {
      socioid: socioId,
      tercerosrelacionados: [cleanData],
    };

    console.log(
      "[tercerosService] intentando PUT a api/SocioTerceroRelacion con wrappedData:",
      wrappedData,
    );
    try {
      const response = await api.put("api/SocioTerceroRelacion", wrappedData);
      console.log("[tercerosService] PUT exitoso. Respuesta:", response.data);
      return response.data;
    } catch (err) {
      console.error(
        "[tercerosService] PUT falló con Status:",
        err.response?.status,
      );
      console.error(
        "[tercerosService] Detalles del error del backend:",
        err.response?.data,
      );
      throw err;
    }
  },

  //------- TERCEROS RELACIONADOS (SGRPlus) ---------

  obtenerTercerosSGRPlus: async (params = {}) =>
    (await api.get("sgrplus/TerceroRelacionado", { params })).data,

  obtenerTerceroPorIdSGRPlus: async (terceroId) =>
    (await api.get(`sgrplus/TerceroRelacionado/${terceroId}`)).data,

  obtenerRelacionesDeSocioSGRPlus: async (socioId) =>
    (await api.get(`sgrplus/SocioTerceroRelacion/${socioId}`)).data,
};

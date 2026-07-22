import { tercerosAdapter } from "../adapters/tercerosAdapter";
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
  crearTercero: async (terceroData) => {
    try {
      const response = await api.post("api/TerceroRelacionado", tercerosAdapter.adaptarPayload1(terceroData));
      return response.data;
    } catch (err) {
      console.error("[tercerosService] POST api/TerceroRelacionado FAILED:", err.response?.status, err.response?.data || err.message);
      throw err;
    }
  },

  // Busca un tercero por CUIT y lo devuelve si ya existe; si no, lo crea con
  // `payloadCreacion`. Dos altas simultáneas para el mismo CUIT (dos
  // pestañas, o dos socios distintos cargando al mismo accionista a la vez)
  // pueden pasar la búsqueda ambas en vacío y disparar dos POST — si el
  // POST de acá falla, se reintenta la búsqueda una vez más antes de
  // propagar el error, para recuperar el tercero que ganó la carrera en vez
  // de duplicarlo o directamente fallar.
  buscarOCrearTercero: async (cuit, payloadCreacion) => {
    const cuitLimpio = String(cuit).replace(/\D/g, "");

    const buscarPorCuit = async () => {
      const existentes = await tercerosService.obtenerTerceros({
        Cuit: cuitLimpio,
      });
      const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
      return arr[0] || null;
    };

    let existente = null;
    try {
      existente = await buscarPorCuit();
    } catch (err) {
      console.warn("[tercerosService] Error buscando tercero por CUIT:", err);
    }
    if (existente) return existente;

    try {
      return await tercerosService.crearTercero({
        ...payloadCreacion,
        cuit: cuitLimpio,
      });
    } catch (createErr) {
      try {
        const recuperado = await buscarPorCuit();
        if (recuperado) return recuperado;
      } catch (retryErr) {
        console.warn(
          "[tercerosService] Error re-buscando tercero tras fallo de creación:",
          retryErr,
        );
      }
      throw createErr;
    }
  },

  // Actualiza un tercero relacionado
  actualizarTercero: async (terceroData) => {
    try {
      const response = await api.put("api/TerceroRelacionado", tercerosAdapter.adaptarPayload2(terceroData));
      return response.data;
    } catch (err) {
      console.error("[tercerosService] PUT api/TerceroRelacionado FAILED:", err.response?.status, err.response?.data || err.message);
      throw err;
    }
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
    const response = await api.post("api/SocioTerceroRelacion", tercerosAdapter.adaptarPayload3(relacionData));
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

    try {
      const response = await api.put("api/SocioTerceroRelacion", tercerosAdapter.adaptarPayload4(wrappedData));
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

  obtenerRelacionesDeSocioSGRPlus: async (socioId) => {
    if (socioId && Number(socioId) < 100000) {
      try {
        const responseWeb = await api.get(`api/Socio/${socioId}`);
        const socioWeb = responseWeb.data;
        const cuit = socioWeb?.cuit || socioWeb?.Cuit;
        if (cuit) {
          const responseSgr = await api.get("sgrplus/Socios", { params: { Cuit: cuit } });
          const sgrSocios = responseSgr.data;
          const arr = Array.isArray(sgrSocios) ? sgrSocios : sgrSocios?.items || [];
          if (arr.length > 0) {
            const sgrSocioId = arr[0].socioid || arr[0].SocioID;
            const responseRel = await api.get(`sgrplus/SocioTerceroRelacion/${sgrSocioId}`);
            return responseRel.data;
          }
        }
      } catch (err) {
        console.warn("[tercerosService] Error resolviendo SGRPlus ID desde Web ID:", err.message);
      }
    }
    const response = await api.get(`sgrplus/SocioTerceroRelacion/${socioId}`);
    return response.data;
  },

  // GET api/Terceros/ExecuteCda?TerceroID=X - Historial de ejecuciones de
  // CDAs de un tercero (accionista/representante/apoderado), análogo a
  // api/Socios/ExecuteCda pero para PANTALLA_SOCIOS. Misma forma de fila
  // que WSSocioExecuteCda, solo cambia el nombre del ID
  // (TerceroExecuteCdaID/TerceroRelacionadoID en vez de
  // SocioExecuteCdaID/SocioID) — ver utils/executeCda.js.
  obtenerExecuteCda: async (terceroId) => {
    const response = await api.get("api/Terceros/ExecuteCda", {
      params: { TerceroID: terceroId },
    });
    return response.data;
  },
};

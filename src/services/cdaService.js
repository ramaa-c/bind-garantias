import { cdaAdapter } from "../adapters/cdaAdapter";
import api from "../api/axios";

export const cdaService = {
  obtenerGrupoCda: async (grupoId) => {
    const response = await api.get("api/cda/GrupoCda", {
      params: { GrupoID: grupoId },
    });
    return response.data;
  },

  obtenerCda: async (cdaId) => {
    const response = await api.get("api/cda/Cda", {
      params: { CdaID: cdaId },
    });
    return response.data;
  },

  obtenerPantallaGrupoCda: async (pantalla, grupoId) => {
    const response = await api.get("api/cda/PantallaGrupoCda", {
      params: { Pantalla: pantalla, GrupoID: grupoId },
    });
    return response.data;
  },

  ejecutarCda: async (pantallaOrObj, cuit, cadenaValorId) => {
    let Pantalla = pantallaOrObj;
    let Cuit = cuit;
    let CadenaValorID = cadenaValorId;
    if (typeof pantallaOrObj === "object" && pantallaOrObj !== null) {
      Pantalla = pantallaOrObj.pantalla || pantallaOrObj.Pantalla;
      Cuit = pantallaOrObj.cuit || pantallaOrObj.Cuit;
      CadenaValorID = pantallaOrObj.cadenaValorId || pantallaOrObj.CadenaValorID || pantallaOrObj.cadenavalorid || cadenaValorId;
    }
    const params = { Pantalla, Cuit };
    if (CadenaValorID !== undefined && CadenaValorID !== null && String(CadenaValorID).trim() !== "" && !isNaN(Number(CadenaValorID))) {
      params.CadenaValorID = Number(CadenaValorID);
    }
    const response = await api.get("api/cda/execute", {
      params,
    });
    return response.data;
  },

  crearCda: async (cdaData) => {
    const response = await api.post("api/cda/Cda", cdaAdapter.adaptarPayload1(cdaData));
    return response.data;
  },

  obtenerTodosCdas: async () => {
    const response = await api.get("api/cda/Cda");
    return response.data;
  },

  vincularPantallaCda: async (payload) => {
    const response = await api.post("api/cda/PantallaGrupoCda", payload);
    return response.data;
  },

  probarCda: async (cuit, expresion) => {
    try {
      const response = await api.post("api/cda/execute:test", {
        Cuit: cuit,
        Expresion: expresion
      });
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data
        };
      }
      throw error;
    }
  },
};

import { cdaAdapter } from "../adapters/cdaAdapter";
import api from "../api/axios";

export const cdaService = {
  // GET api/cda/GrupoCda?Pantalla=X - Devuelve el listado de vinculos CDA<->Pantalla ([{ GrupoCdaID, CdaID, PantallaGrupoCdaID }])
  obtenerGrupoCda: async (pantalla) => {
    const response = await api.get("api/cda/GrupoCda", {
      params: { Pantalla: pantalla },
    });
    return response.data;
  },

  obtenerCda: async (cdaId) => {
    const response = await api.get("api/cda/Cda", {
      params: { CdaID: cdaId },
    });
    return response.data;
  },

  // GET api/cda/PantallaGrupoCda?Pantalla=X - Devuelve { PantallaGrupoCdaID, Pantalla, ExpresionAgrupacion } (sin listado de CDAs)
  obtenerPantallaGrupoCda: async (pantalla) => {
    const response = await api.get("api/cda/PantallaGrupoCda", {
      params: { Pantalla: pantalla },
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

  actualizarCda: async (cdaData) => {
    const response = await api.put("api/cda/Cda", cdaAdapter.adaptarPayload1(cdaData));
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

  // GET api/cda/execute?CdaID=X&Cuit=Y - Vuelve a evaluar un CDA puntual (ej.
  // tras reactivar una integración que lo había dejado en estado Pendiente).
  // Igual que probarCda: nunca tira, devuelve { status, data } para poder
  // diferenciar 202 (aprobado) de 406 (rechazado) sin try/catch afuera.
  reejecutarCda: async ({ cdaId, cuit, usuarioId }) => {
    const params = { CdaID: cdaId, Cuit: cuit };
    if (usuarioId) params.UsuarioID = usuarioId;
    try {
      const response = await api.get("api/cda/execute", { params });
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  },

  probarCda: async (cuit, expresion, expresionLog) => {
    try {
      const response = await api.post("api/cda/execute:test", {
        Cuit: cuit,
        Expresion: expresion,
        ExpresionLog: expresionLog || ""
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

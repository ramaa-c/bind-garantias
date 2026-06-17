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

  ejecutarCda: async (pantallaOrObj, cuit) => {
    let Pantalla = pantallaOrObj;
    let Cuit = cuit;
    if (typeof pantallaOrObj === "object" && pantallaOrObj !== null) {
      Pantalla = pantallaOrObj.pantalla || pantallaOrObj.Pantalla;
      Cuit = pantallaOrObj.cuit || pantallaOrObj.Cuit;
    }
    const response = await api.get("api/cda/execute", {
      params: { Pantalla, Cuit },
    });
    return response.data;
  },

  crearCda: async (cdaData) => {
    const response = await api.post("api/cda/Cda", cdaData);
    return response.data;
  },

  obtenerTodosCdas: async () => {
    const response = await api.get("api/cda/Cda");
    return response.data;
  },
};

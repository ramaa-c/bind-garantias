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

  ejecutarCda: async (data) => {
    const response = await api.post("api/cda/execute", data);
    return response.data;
  },
};

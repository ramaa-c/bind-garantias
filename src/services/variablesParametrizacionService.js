import api from "../api/axios";

export const variablesParametrizacionService = {
  obtenerVariablesParametrizacion: async () =>
    (await api.get("api/VariablesParametrizacion")).data,
};

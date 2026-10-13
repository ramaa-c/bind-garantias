import api from "../api/axios";
import { variablesParametrizacionAdapter } from "../adapters/variablesParametrizacionAdapter";

export const variablesParametrizacionService = {
  obtenerVariablesParametrizacion: async () =>
    (await api.get("api/VariablesParametrizacion")).data,

  crear: async (data) =>
    (
      await api.post(
        "api/VariablesParametrizacion",
        variablesParametrizacionAdapter.adaptarPayload1(data),
      )
    ).data,

  actualizar: async (data) =>
    (
      await api.put(
        "api/VariablesParametrizacion",
        variablesParametrizacionAdapter.adaptarPayload2(data),
      )
    ).data,
};

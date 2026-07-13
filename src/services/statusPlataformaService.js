import api from "../api/axios";
import { statusPlataformaAdapter } from "../adapters/statusPlataformaAdapter";

export const statusPlataformaService = {
  obtenerStatus: async () => (await api.get("api/StatusPlataforma")).data,
  actualizarStatus: async (data) =>
    (await api.post("api/StatusPlataforma", statusPlataformaAdapter.adaptarPayload(data))).data,
};

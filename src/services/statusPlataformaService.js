import api from "../api/axios";
import { statusPlataformaAdapter } from "../adapters/statusPlataformaAdapter";

const ESTADO_PLATAFORMA_ACTIVA = 302;
const ESTADO_PLATAFORMA_INACTIVA = 404;

export const statusPlataformaService = {
  obtenerStatus: async () => (await api.get("api/StatusPlataforma")).data,
  actualizarStatus: async (data) =>
    (await api.post("api/StatusPlataforma", statusPlataformaAdapter.adaptarPayload(data))).data,
  obtenerPlataformaOnline: async () => {
    const { status } = await api.get("api/PlataformaOnline", {
      sinToken: true,
      validateStatus: (codigo) =>
        codigo === ESTADO_PLATAFORMA_ACTIVA ||
        codigo === ESTADO_PLATAFORMA_INACTIVA ||
        (codigo >= 200 && codigo < 300),
    });
    return { statusgeneral: status === ESTADO_PLATAFORMA_INACTIVA ? "0" : "1" };
  },
};

import { solicitudesAdapter } from "../adapters/solicitudesAdapter";
import api from "../api/axios";

export const solicitudesService = {
  obtenerSolicitudesEnProceso: async (cuit) => {
    const response = await api.get(`sgrplus/SolicitudEnProceso/${cuit}`);
    return response.data;
  },

  crearSolicitudEnProceso: async (solicitudData) => {
    const response = await api.post("sgrplus/SolicitudEnProceso", solicitudesAdapter.adaptarPayload1(solicitudData));
    return response.data;
  },
};

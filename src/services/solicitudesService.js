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

  // PUT sgrplus/SolicitudEnProceso (agregado en el backend el 2026-08-18).
  actualizarSolicitudEnProceso: async (solicitudData) => {
    const response = await api.put("sgrplus/SolicitudEnProceso", solicitudesAdapter.adaptarPayload1(solicitudData));
    return response.data;
  },

  // Cada vez que cambia el estado de TipoLimiteSocio (aprobar/rechazar/
  // cancelar) hay que reflejar el mismo cambio en SolicitudEnProceso.EstadoSolicitud
  // — ambas tablas usan literalmente el mismo catálogo desde el 2026-08-18
  // (ver utils/estadoLimiteSocio.js), así que nuevoEstadoSolicitud se manda
  // tal cual, sin traducir. El PUT espera la entidad completa, así que
  // primero se trae la fila vigente (por CUIT) para no perder el resto de
  // sus campos — y si ya no está (se sincronizó antes, o el backend ya la
  // dio de baja por vencimiento) no hay nada para actualizar.
  sincronizarEstadoSolicitudEnProceso: async (cuit, solicitudEnProcesoId, nuevoEstadoSolicitud) => {
    if (!cuit || !solicitudEnProcesoId) return null;
    const solicitudes = await solicitudesService.obtenerSolicitudesEnProceso(cuit);
    const lista = Array.isArray(solicitudes) ? solicitudes : solicitudes ? [solicitudes] : [];
    const solicitudVigente = lista.find(
      (s) => Number(s.solicitudenprocesoid ?? s.SolicitudEnProcesoID) === Number(solicitudEnProcesoId),
    );
    if (!solicitudVigente) return null;
    return solicitudesService.actualizarSolicitudEnProceso({
      ...solicitudVigente,
      estadosolicitud: nuevoEstadoSolicitud,
    });
  },
};

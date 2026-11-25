import api from "../api/axios";
import { usuarioVinculacionAdapter } from "../adapters/usuarioVinculacionAdapter";

const comoLista = (data) => (Array.isArray(data) ? data : data ? [data] : []);

export const usuarioVinculacionService = {
  // POST api/UsuarioVinculacion - Único punto para sumar personas a un CUIT: la API invita o vincula según el correo
  invitar: async (invitacion) =>
    (
      await api.post("api/UsuarioVinculacion", usuarioVinculacionAdapter.adaptarInvitacion(invitacion), {
        noRetry: true,
      })
    ).data,

  // GET api/UsuarioVinculacion?Cuit= - Invitaciones del CUIT (solo administradores)
  listarInvitaciones: async (cuit) =>
    comoLista(
      (await api.get("api/UsuarioVinculacion", { params: { Cuit: String(cuit).replace(/\D/g, "") } })).data,
    ),

  // GET api/AsistenciaInterna - Las que pidió el usuario y las que atiende como asistente
  listarAsistencias: async () => {
    try {
      return comoLista((await api.get("api/AsistenciaInterna")).data);
    } catch (error) {
      if (error.response?.status === 404) return [];
      throw error;
    }
  },
};

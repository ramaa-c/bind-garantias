import { usuarioAdapter } from "../adapters/usuarioAdapter";
import api from "../api/axios";
import { guardarTokenApi, cerrarSesionApi } from "../api/tokenApi";

const cadenaDelPath = () => {
  const primerSegmento = window.location.pathname.split("/")[1];
  return /^\d+$/.test(primerSegmento) ? Number(primerSegmento) : undefined;
};

const obtenerTokenDeUsuario = async ({ email, password }) => {
  const { data } = await api.post(
    "api/auth/login",
    {
      jwtusername: email,
      jwtpassword: password,
      host: window.location.hostname,
      cadenaId: cadenaDelPath(),
    },
    { sinToken: true, noRetry: true },
  );
  const token = data?.token;
  if (!token) throw new Error("La API no devolvió un token de acceso");
  cerrarSesionApi();
  guardarTokenApi(token);
  return data;
};

export const usuarioService = {
  // POST api/auth/login (email + clave)
  login: obtenerTokenDeUsuario,

  // POST api/usuario/login:requestcode
  solicitarCodigoLogin: async (email) =>
    (await api.post("api/usuario/login-requestcode", usuarioAdapter.adaptarPayload2({ email }), { sinToken: true })).data,

  // POST api/auth/login (email + código recibido por mail)
  loginByCode: obtenerTokenDeUsuario,

  // PUT api/usuario/password:reset
  resetearPassword: async (payloadSkeletor) =>
    (
      await api.put(
        `api/usuario/password-reset`,
        usuarioAdapter.adaptarPayload3(payloadSkeletor),
        { sinToken: true },
      )
    ).data,

  // POST api/usuario/alta
  crearUsuario: async (nuevoUsuario) =>
    (await api.post("api/usuario/alta", usuarioAdapter.adaptarPayload4(nuevoUsuario), { sinToken: true })).data,

  // PUT api/usuario/{usuarioid}/password:change
  cambiarPassword: async (usuarioId, datosCambioClave) =>
    (await api.put(`api/usuario/${usuarioId}/password-change`, usuarioAdapter.adaptarPayload5(datosCambioClave))).data,

  // GET api/usuario/estado/{encrypt}:byencrypt
  // 302 activa / 409 pendiente (Estado 2) / 423 bloqueada (Estado 0) / 403 bloqueada por admin (Estado 9) / 404 no existe / 406 vencido
  obtenerEstadoPorEncrypt: async (encryptToken) => {
    const { status } = await api.get(
      `api/usuario/estado/${encodeURIComponent(encryptToken)}-byencrypt`,
      {
        sinToken: true,
        noRetry: true,
        validateStatus: (codigo) =>
          [302, 403, 404, 406, 409, 423].includes(codigo) ||
          (codigo >= 200 && codigo < 300),
      },
    );
    if (status === 409) return "pendiente";
    if (status === 423) return "bloqueada";
    if (status === 403) return "bloqueada_admin";
    if (status === 404) return "inexistente";
    if (status === 406) return "expirado";
    return "activa";
  },

  // PUT api/usuario/password:new (identifica al usuario por el token del mail)
  establecerClaveNueva: async ({ encrypt, newPassword }) =>
    (
      await api.put(
        "api/usuario/password-new",
        usuarioAdapter.adaptarPayload6({
          oldpassword: "",
          newpassword: newPassword,
          encrypt,
        }),
        { sinToken: true, noRetry: true },
      )
    ).data,

  // PUT api/usuario/{encrypt}/status:release (reactiva/desbloquea con el token del mail)
  reactivarUsuario: async (encrypt) =>
    (
      await api.put(
        `api/usuario/${encodeURIComponent(encrypt)}/status-release`,
        null,
        { sinToken: true, noRetry: true },
      )
    ).data,

  obtenerPorNombreOEmail: async (identificador) =>
    (await api.get(`api/usuario/${encodeURIComponent(identificador)}/pornombre`)).data,

  listarUsuarios: async ({ page = 1, pageSize = 1000 } = {}) =>
    (await api.get("api/usuarios", { params: { page, page_size: pageSize } })).data,

  bloquearUsuario: async (usuarioId) =>
    (await api.put(`api/usuario/${usuarioId}/status-block`, {}, { noRetry: true })).data,

  desbloquearUsuario: async (usuarioId) =>
    (await api.put(`api/usuario/${usuarioId}/status-unblock`, {}, { noRetry: true })).data,

  // GET api/usuario/{usuarioid}
  obtenerUsuarioPorId: async (usuarioId) =>
    (await api.get(`api/usuario/${usuarioId}`)).data,

  // GET api/UsuarioCadenaValor
  obtenerUsuariosRelacionados: async (params) => {
    return (await api.get("api/UsuarioCadenaValor", { params })).data;
  },

  // POST api/UsuarioCadenaValor
  crearUsuarioCadenaValor: async (payload) => {
    return (await api.post("api/UsuarioCadenaValor", usuarioAdapter.adaptarPayload7(payload))).data;
  },

  // PUT api/UsuarioCadenaValor
  actualizarUsuarioCadenaValor: async (payload) => {
    return (await api.put("api/UsuarioCadenaValor", usuarioAdapter.adaptarPayload8(payload))).data;
  },

  // PUT api/usuario/actualizar
  actualizarUsuario: async (data) =>
    (await api.put("api/usuario/actualizar", usuarioAdapter.adaptarPayload9(data))).data,

  // POST api/usuario/notificar
  notificarUsuario: async (data) =>
    (await api.post("api/usuario/notificar", usuarioAdapter.adaptarPayload10(data))).data,
};


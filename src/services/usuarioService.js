import { usuarioAdapter } from "../adapters/usuarioAdapter";
import api from "../api/axios";
import { guardarTokenApi, cerrarSesionApi } from "../api/tokenApi";

const obtenerTokenDeUsuario = async ({ email, password }) => {
  const { data } = await api.post("api/auth/login", null, {
    sinToken: true,
    noRetry: true,
    headers: { jwtusername: email, jwtpassword: password },
  });
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
  // 302 activa / 409 pendiente (Estado 2) / 423 bloqueada (Estado 0) / 404 no existe / 406 vencido
  obtenerEstadoPorEncrypt: async (encryptToken) => {
    const { status } = await api.get(
      `api/usuario/estado/${encodeURIComponent(encryptToken)}-byencrypt`,
      {
        sinToken: true,
        noRetry: true,
        validateStatus: (codigo) =>
          [302, 404, 406, 409, 423].includes(codigo) ||
          (codigo >= 200 && codigo < 300),
      },
    );
    if (status === 409) return "pendiente";
    if (status === 423) return "bloqueada";
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
        { sinToken: true },
      )
    ).data,

  // PUT api/usuario/{encrypt}/status:release (reactiva/desbloquea con el token del mail)
  reactivarUsuario: async (encrypt) =>
    (
      await api.put(
        `api/usuario/${encodeURIComponent(encrypt)}/status-release`,
        null,
        { sinToken: true },
      )
    ).data,

  obtenerPorNombreOEmail: async (identificador) => {
    try {
      const response = await api.get(`api/usuario/${identificador}/pornombre`);
      return response.data;
    } catch (error) {
      if (identificador && identificador.includes("@")) {
        try {
          const resSearch = await api.get("api/usuarios", {
            params: { page: 1, page_size: 1, Email: identificador },
          });
          const listData = resSearch.data;
          const list = Array.isArray(listData)
            ? listData
            : (listData?.items || listData?.data || listData?.resultados || listData?.list || []);
          if (list.length > 0 && list[0]) {
            const encontrado = list[0];
            // ⚠️ GET api/usuarios devuelve Denominacion corrompida (a veces
            // el ID de una cadena en vez del nombre real cargado al dar de
            // alta al usuario — reportado al backend, confirmado en vivo el
            // 2026-09-04). Esta rama solo existe para ubicar el
            // UsuarioWebID cuando /pornombre falla; con ese id se pide el
            // registro real por api/usuario/{id} (misma fuente confiable
            // que /pornombre) en vez de confiar en nada de esta búsqueda.
            const usuarioWebId =
              encontrado.usuariowebid ?? encontrado.UsuarioWebID ?? encontrado.id;
            if (usuarioWebId) {
              try {
                return await usuarioService.obtenerUsuarioPorId(usuarioWebId);
              } catch (porIdErr) {
                console.warn(
                  "[usuarioService] No se pudo confirmar el usuario por id tras el fallback de api/usuarios:",
                  porIdErr,
                );
              }
            }
            // Si ni el id resolvió, se devuelve igual para no romper a
            // quien solo necesita estado/usuariowebid — pero sin
            // Denominacion, que en esta fuente no es confiable.
            const { Denominacion: _d1, denominacion: _d2, ...sinDenominacion } =
              encontrado;
            return sinDenominacion;
          }
        } catch (searchErr) {
          console.warn(
            "[usuarioService] Fallback by email search failed:",
            searchErr.message,
          );
        }
      }
      throw error;
    }
  },

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


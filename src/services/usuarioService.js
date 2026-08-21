import { usuarioAdapter } from "../adapters/usuarioAdapter";
import api from "../api/axios";

export const usuarioService = {
  // POST api/usuario/login
  login: async (credenciales) =>
    (await api.post("api/usuario/login", usuarioAdapter.adaptarPayload1(credenciales))).data,

  // POST api/usuario/login:bycode
  loginByCode: async (credenciales) =>
    (await api.post("api/usuario/login-bycode", usuarioAdapter.adaptarPayload2(credenciales))).data,

  // PUT api/usuario/{usuarioid}/status:block
  bloquearUsuario: async (usuarioId) =>
    (await api.put(`api/usuario/${usuarioId}/status-block`, {})).data,

  // PUT api/usuario/{usuarioid}/status:release
  reactivarUsuario: async (usuarioId) =>
    (await api.put(`api/usuario/${usuarioId}/status-release`, {})).data,

  // PUT api/usuario/password:reset
  resetearPassword: async (payloadSkeletor) =>
    (await api.put(`api/usuario/password-reset`, usuarioAdapter.adaptarPayload3(payloadSkeletor))).data,

  // POST api/usuario/alta
  crearUsuario: async (nuevoUsuario) =>
    (await api.post("api/usuario/alta", usuarioAdapter.adaptarPayload4(nuevoUsuario))).data,

  // PUT api/usuario/{usuarioid}/password:change
  cambiarPassword: async (usuarioId, datosCambioClave) =>
    (await api.put(`api/usuario/${usuarioId}/password-change`, usuarioAdapter.adaptarPayload5(datosCambioClave))).data,

  // GET api/usuario/{encrypt}/:byencrypt
  obtenerPorEncrypt: async (encryptToken) =>
    (await api.get(`api/usuario/${encodeURIComponent(encryptToken)}/byencrypt`))
      .data,

  // PUT api/usuario/{usuarioid}/password:new
  establecerClaveNueva: async ({ usuarioid, data }) =>
    (await api.put(`api/usuario/${usuarioid}/password-new`, usuarioAdapter.adaptarPayload6(data))).data,

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
            return list[0];
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

  // Un usuario existe pero su cuenta todavía no está activa (Estado!=="1").
  //
  // ⚠️ A propósito NO mira DebeCambiarClave: ese campo solo indica si la
  // cuenta tiene una contraseña propia seteada o no (queda en "1" tanto al
  // darse de alta como al pedir "Recuperar clave", y también si el usuario
  // hace "Omitir e ingresar con código" en CrearClave.jsx — ese camino activa
  // la cuenta vía reactivarUsuario/status-release sin tocar la contraseña) —
  // no es un indicador de si la cuenta está pendiente de activación. Ingresar
  // con código es una forma de acceso legítima y permanente, no un estado
  // transitorio; si el usuario más adelante quiere una contraseña, tiene
  // "Recuperar clave" para eso. Antes esta función exigía además
  // DebeCambiarClave==="1", lo que hacía que un usuario que ya usó "ingresar
  // con código" viera el modal de "cuenta pendiente de activación" al fallar
  // cualquier login normal, aunque su cuenta estuviera 100% activa.
  //
  // Nota: un usuario bloqueado por un admin (bloquearUsuario/status-block)
  // también queda con Estado!=="1", igual que uno que nunca se activó — se
  // acordó tratarlos igual acá (mismo modal/mensaje para ambos casos).
  //
  // Único lugar que hace esta comparación: si cambia el casing/tipo que
  // devuelve el backend, se corrige acá y no en cada pantalla.
  esCuentaPendienteActivacion: async (email) => {
    try {
      const userData = await usuarioService.obtenerPorNombreOEmail(email);
      const targetUser = Array.isArray(userData)
        ? userData[0]
        : userData?.items?.[0] || userData?.data?.[0] || userData;
      return !!targetUser && String(targetUser.estado) !== "1";
    } catch {
      return false;
    }
  },

  // GET api/usuarios
  buscarUsuarios: async (page = 1, pageSize = 10, email = "", nombre = "") => {
    const params = { page, page_size: pageSize };
    if (email) params.Email = email;
    if (nombre) params.Nombre = nombre;
    return (await api.get("api/usuarios", { params })).data;
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
};


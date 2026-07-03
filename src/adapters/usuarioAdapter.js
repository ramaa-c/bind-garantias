import { normalizarClaves } from "../utils/normalizarClaves";

export const usuarioAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      Email: d.email,
      Password: d.password,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      Email: d.email,
      Password: d.password,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      Email: d.email,
      UsuarioWebID: d.usuariowebid,
      fchAlta: d.fchalta,
      fchVencimiento: d.fchvencimiento,
      HashSeguridad: d.hashseguridad,
      Estado: d.estado,
      DebeCambiarClave: d.debecambiarclave,
      EsAdministrador: d.esadministrador,
      Denominacion: d.denominacion,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      Email: d.email,
      UsuarioWebID: d.usuariowebid ?? 0,
      fchAlta: d.fchalta,
      fchVencimiento: d.fchvencimiento,
      HashSeguridad: d.hashseguridad,
      Estado: d.estado,
      DebeCambiarClave: d.debecambiarclave,
      EsAdministrador: d.esadministrador,
      Denominacion: d.denominacion,
    };
  },
  adaptarPayload5: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      oldPassword: d.oldpassword,
      newPassword: d.newpassword,
    };
  },
  adaptarPayload6: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      oldPassword: d.oldpassword,
      newPassword: d.newpassword,
    };
  },
  adaptarPayload7: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      UsuarioCadenaValorID: d.usuariocadenavalorid,
      CadenaValorID: d.cadenavalorid,
      UsuarioWebID: d.usuariowebid,
      Activa: d.activa,
    };
  },
  adaptarPayload8: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      UsuarioCadenaValorID: d.usuariocadenavalorid,
      CadenaValorID: d.cadenavalorid,
      UsuarioWebID: d.usuariowebid,
      Activa: d.activa,
    };
  },
  adaptarPayload9: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      UsuarioWebID: d.usuariowebid,
      Denominacion: d.denominacion,
    };
  },
};

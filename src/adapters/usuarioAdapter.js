export const usuarioAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      Email: data?.email ?? data?.Email,
      Password: data?.password ?? data?.Password,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    return {
      Email: data?.email ?? data?.Email,
      Password: data?.password ?? data?.Password,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    return {
      Email: data?.email ?? data?.Email,
      UsuarioWebID: data?.usuarioWebID ?? data?.UsuarioWebID ?? data?.usuariowebid,
      fchAlta: data?.fchAlta ?? data?.fchAlta ?? data?.fchalta,
      fchVencimiento: data?.fchVencimiento ?? data?.fchVencimiento ?? data?.fchvencimiento,
      HashSeguridad: data?.hashSeguridad ?? data?.HashSeguridad ?? data?.hashseguridad,
      Estado: data?.estado ?? data?.Estado,
      DebeCambiarClave: data?.debeCambiarClave ?? data?.DebeCambiarClave ?? data?.debecambiarclave,
      EsAdministrador: data?.esAdministrador ?? data?.EsAdministrador ?? data?.esadministrador,
      Denominacion: data?.denominacion ?? data?.Denominacion,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    return {
      Email: data?.email ?? data?.Email,
      UsuarioWebID: data?.usuarioWebID ?? data?.UsuarioWebID ?? data?.usuariowebid ?? 0,
      fchAlta: data?.fchAlta ?? data?.fchAlta ?? data?.fchalta,
      fchVencimiento: data?.fchVencimiento ?? data?.fchVencimiento ?? data?.fchvencimiento,
      HashSeguridad: data?.hashSeguridad ?? data?.HashSeguridad ?? data?.hashseguridad,
      Estado: data?.estado ?? data?.Estado,
      DebeCambiarClave: data?.debeCambiarClave ?? data?.DebeCambiarClave ?? data?.debecambiarclave,
      EsAdministrador: data?.esAdministrador ?? data?.EsAdministrador ?? data?.esadministrador,
      Denominacion: data?.denominacion ?? data?.Denominacion,
    };
  },
  adaptarPayload5: (data) => {
    if (!data) return data;
    return {
      oldPassword: data?.oldPassword ?? data?.oldPassword,
      newPassword: data?.newPassword ?? data?.newPassword,
    };
  },
  adaptarPayload6: (data) => {
    if (!data) return data;
    return {
      oldPassword: data?.oldPassword ?? data?.oldPassword,
      newPassword: data?.newPassword ?? data?.newPassword,
    };
  },
  adaptarPayload7: (data) => {
    if (!data) return data;
    return {
      UsuarioCadenaValorID: data?.usuarioCadenaValorID ?? data?.UsuarioCadenaValorID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      UsuarioWebID: data?.usuarioWebID ?? data?.UsuarioWebID,
      Activa: data?.activa ?? data?.Activa,
    };
  },
  adaptarPayload8: (data) => {
    if (!data) return data;
    return {
      UsuarioCadenaValorID: data?.usuarioCadenaValorID ?? data?.UsuarioCadenaValorID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      UsuarioWebID: data?.usuarioWebID ?? data?.UsuarioWebID,
      Activa: data?.activa ?? data?.Activa,
    };
  },
};

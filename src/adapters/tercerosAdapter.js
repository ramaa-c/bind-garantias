export const tercerosAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      TerceroRelacionadoID: data?.terceroRelacionadoID ?? data?.TerceroRelacionadoID,
      Denominacion: data?.denominacion ?? data?.Denominacion,
      Cuit: data?.cuit ?? data?.Cuit,
      BcraId: data?.bcraId ?? data?.BcraId,
      TipoPersonaID: data?.tipoPersonaID ?? data?.TipoPersonaID,
      TipoDocumentoID: data?.tipoDocumentoID ?? data?.TipoDocumentoID,
      NumeroDocumento: data?.numeroDocumento ?? data?.NumeroDocumento,
      EstadoCivilID: data?.estadoCivilID ?? data?.EstadoCivilID,
      CiudadID: data?.ciudadID ?? data?.CiudadID,
      Telefono: data?.telefono ?? data?.Telefono,
      Conyuge: data?.conyuge ?? data?.Conyuge,
      Actividad: data?.actividad ?? data?.Actividad,
      Contacto: data?.contacto ?? data?.Contacto,
      NroCuenta: data?.nroCuenta ?? data?.NroCuenta,
      CodigoMercado: data?.codigoMercado ?? data?.CodigoMercado,
      Calle: data?.calle ?? data?.Calle,
      Numero: data?.numero ?? data?.Numero,
      Piso: data?.piso ?? data?.Piso,
      Departamento: data?.departamento ?? data?.Departamento,
      CodPos: data?.codPos ?? data?.CodPos,
      DescripcionReducida: data?.descripcionReducida ?? data?.DescripcionReducida,
      Mail: data?.mail ?? data?.Mail,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    return {
      TerceroRelacionadoID: data?.terceroRelacionadoID ?? data?.TerceroRelacionadoID,
      Denominacion: data?.denominacion ?? data?.Denominacion,
      Cuit: data?.cuit ?? data?.Cuit,
      BcraId: data?.bcraId ?? data?.BcraId,
      TipoPersonaID: data?.tipoPersonaID ?? data?.TipoPersonaID,
      TipoDocumentoID: data?.tipoDocumentoID ?? data?.TipoDocumentoID,
      NumeroDocumento: data?.numeroDocumento ?? data?.NumeroDocumento,
      EstadoCivilID: data?.estadoCivilID ?? data?.EstadoCivilID,
      CiudadID: data?.ciudadID ?? data?.CiudadID,
      Telefono: data?.telefono ?? data?.Telefono,
      Conyuge: data?.conyuge ?? data?.Conyuge,
      Actividad: data?.actividad ?? data?.Actividad,
      Contacto: data?.contacto ?? data?.Contacto,
      NroCuenta: data?.nroCuenta ?? data?.NroCuenta,
      CodigoMercado: data?.codigoMercado ?? data?.CodigoMercado,
      Calle: data?.calle ?? data?.Calle,
      Numero: data?.numero ?? data?.Numero,
      Piso: data?.piso ?? data?.Piso,
      Departamento: data?.departamento ?? data?.Departamento,
      CodPos: data?.codPos ?? data?.CodPos,
      DescripcionReducida: data?.descripcionReducida ?? data?.DescripcionReducida,
      Mail: data?.mail ?? data?.Mail,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    return {
      SocioID: data?.socioID ?? data?.SocioID,
      TercerosRelacionados: data?.tercerosRelacionados ?? data?.TercerosRelacionados,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    return {
      SocioTerceroRelacionID: data?.socioTerceroRelacionID ?? data?.SocioTerceroRelacionID,
      SocioID: data?.socioID ?? data?.SocioID,
      TerceroID: data?.terceroID ?? data?.TerceroID,
      TipoRelacionSocioID: data?.tipoRelacionSocioID ?? data?.TipoRelacionSocioID,
      FechaDesde: data?.fechaDesde ?? data?.FechaDesde,
      FechaHasta: data?.fechaHasta ?? data?.FechaHasta,
      PorcAcciones: data?.porcAcciones ?? data?.PorcAcciones,
      NroInscripcion: data?.nroInscripcion ?? data?.NroInscripcion,
      CondicionesComerciales: data?.condicionesComerciales ?? data?.CondicionesComerciales,
      CBU: data?.cBU ?? data?.CBU,
      ProvinciaID: data?.provinciaID ?? data?.ProvinciaID,
      NroSubcuentaCaja: data?.nroSubcuentaCaja ?? data?.NroSubcuentaCaja,
      SucursalID: data?.sucursalID ?? data?.SucursalID,
      Default: data?.default ?? data?.Default,
      SubTipoRelacionSocioID: data?.subTipoRelacionSocioID ?? data?.SubTipoRelacionSocioID,
      Telefono: data?.telefono ?? data?.Telefono,
      Momento: data?.momento ?? data?.Momento,
    };
  },
};

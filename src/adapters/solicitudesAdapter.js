export const solicitudesAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      SolicitudEnProcesoID: data?.solicitudEnProcesoID ?? data?.SolicitudEnProcesoID,
      FechaCarga: data?.fechaCarga ?? data?.FechaCarga,
      Cuit: data?.cuit ?? data?.Cuit,
      TipoLimiteID: data?.tipoLimiteID ?? data?.TipoLimiteID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      MonedaID: data?.monedaID ?? data?.MonedaID,
      Importe: data?.importe ?? data?.Importe,
      EstadoSolicitud: data?.estadoSolicitud ?? data?.EstadoSolicitud,
      IDExterno: data?.iDExterno ?? data?.IDExterno,
      TerceroViaID: data?.terceroViaID ?? data?.TerceroViaID,
    };
  },
};

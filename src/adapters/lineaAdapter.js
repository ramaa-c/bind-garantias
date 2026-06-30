export const lineaAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      TipoLimiteSocioID: data?.tipoLimiteSocioID ?? data?.TipoLimiteSocioID,
      SocioID: data?.socioID ?? data?.SocioID,
      TipoLimiteID: data?.tipoLimiteID ?? data?.TipoLimiteID,
      fchVigenciaDesde: data?.fchVigenciaDesde ?? data?.fchVigenciaDesde,
      fchVigenciaHasta: data?.fchVigenciaHasta ?? data?.fchVigenciaHasta,
      MonedaId: data?.monedaId ?? data?.MonedaId,
      ImporteLimite: data?.importeLimite ?? data?.ImporteLimite,
      ImporteUtilizado: data?.importeUtilizado ?? data?.ImporteUtilizado,
      TipoLimiteEstadoID: data?.tipoLimiteEstadoID ?? data?.TipoLimiteEstadoID,
      Observaciones: data?.observaciones ?? data?.Observaciones,
      TerceroMercadoId: data?.terceroMercadoId ?? data?.TerceroMercadoId,
      TerceroPresentanteId: data?.terceroPresentanteId ?? data?.TerceroPresentanteId,
      DestFondosID: data?.destFondosID ?? data?.DestFondosID,
      TipoComisionId: data?.tipoComisionId ?? data?.TipoComisionId,
      PorcentajeComision: data?.porcentajeComision ?? data?.PorcentajeComision,
      SucursalId: data?.sucursalId ?? data?.SucursalId,
      ImporteCargado: data?.importeCargado ?? data?.ImporteCargado,
      AvalId: data?.avalId ?? data?.AvalId,
      Propuesta: data?.propuesta ?? data?.Propuesta,
      Resolucion: data?.resolucion ?? data?.Resolucion,
      TipoLimiteSolicitudID: data?.tipoLimiteSolicitudID ?? data?.TipoLimiteSolicitudID,
      ImporteMonex: data?.importeMonex ?? data?.ImporteMonex,
      TipoLibradorID: data?.tipoLibradorID ?? data?.TipoLibradorID,
      ContratoID: data?.contratoID ?? data?.ContratoID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      EquipoComercialID: data?.equipoComercialID ?? data?.EquipoComercialID,
      SolicitudID: data?.solicitudID ?? data?.SolicitudID,
      TipoLimiteRiesgoID: data?.tipoLimiteRiesgoID ?? data?.TipoLimiteRiesgoID,
      TerceroViaId: data?.terceroViaId ?? data?.TerceroViaId,
      TerceroGeneradorID: data?.terceroGeneradorID ?? data?.TerceroGeneradorID,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    return {
      TipoLimiteCadenaValorID: data?.tipoLimiteCadenaValorID ?? data?.TipoLimiteCadenaValorID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      TipoLimiteID: data?.tipoLimiteID ?? data?.TipoLimiteID,
      Descripcion: data?.descripcion ?? data?.Descripcion,
      MonedaID: data?.monedaID ?? data?.MonedaID,
      MontoMaximo: data?.montoMaximo ?? data?.MontoMaximo,
      DiasVigencia: data?.diasVigencia ?? data?.DiasVigencia,
      AptaNuevaLinea: data?.aptaNuevaLinea ?? data?.AptaNuevaLinea,
      Activa: data?.activa ?? data?.Activa,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    return {
      TipoLimiteCadenaValorID: data?.tipoLimiteCadenaValorID ?? data?.TipoLimiteCadenaValorID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      TipoLimiteID: data?.tipoLimiteID ?? data?.TipoLimiteID,
      Descripcion: data?.descripcion ?? data?.Descripcion,
      MonedaID: data?.monedaID ?? data?.MonedaID,
      MontoMaximo: data?.montoMaximo ?? data?.MontoMaximo,
      DiasVigencia: data?.diasVigencia ?? data?.DiasVigencia,
      AptaNuevaLinea: data?.aptaNuevaLinea ?? data?.AptaNuevaLinea,
      Activa: data?.activa ?? data?.Activa,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    return {
      TipoObligacionTipoLimiteID: data?.tipoObligacionTipoLimiteID ?? data?.TipoObligacionTipoLimiteID,
      TipoObligacionID: data?.tipoObligacionID ?? data?.TipoObligacionID,
      TipoLimiteID: data?.tipoLimiteID ?? data?.TipoLimiteID,
      Descripcion: data?.descripcion ?? data?.Descripcion,
    };
  },
  adaptarPayload5: (data) => {
    if (!data) return data;
    return {
      TipoObligacionTipoLimiteID: data?.tipoObligacionTipoLimiteID ?? data?.TipoObligacionTipoLimiteID,
      TipoObligacionID: data?.tipoObligacionID ?? data?.TipoObligacionID,
      TipoLimiteID: data?.tipoLimiteID ?? data?.TipoLimiteID,
      Descripcion: data?.descripcion ?? data?.Descripcion,
    };
  },
};

export const cadenaValorAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      Denominacion: data?.denominacion ?? data?.Denominacion,
      Referencia: data?.referencia ?? data?.Referencia,
      Logo: data?.logo ?? data?.Logo,
      TipoCanalComercializacionID: data?.tipoCanalComercializacionID ?? data?.TipoCanalComercializacionID,
      EquipoComercialID: data?.equipoComercialID ?? data?.EquipoComercialID,
      MontoMaximo: data?.montoMaximo ?? data?.MontoMaximo,
      PorcentajeMaximo: data?.porcentajeMaximo ?? data?.PorcentajeMaximo,
      Activa: data?.activa ?? data?.Activa,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    return {
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      Denominacion: data?.denominacion ?? data?.Denominacion,
      Referencia: data?.referencia ?? data?.Referencia,
      Logo: data?.logo ?? data?.Logo,
      TipoCanalComercializacionID: data?.tipoCanalComercializacionID ?? data?.TipoCanalComercializacionID,
      EquipoComercialID: data?.equipoComercialID ?? data?.EquipoComercialID,
      MontoMaximo: data?.montoMaximo ?? data?.MontoMaximo,
      PorcentajeMaximo: data?.porcentajeMaximo ?? data?.PorcentajeMaximo,
      Activa: data?.activa ?? data?.Activa,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    return {
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      ListaCda: data?.listaCda ?? data?.ListaCda,
    };
  },
};

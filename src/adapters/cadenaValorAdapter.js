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
    const cadenaValorID = data?.cadenavalorid ?? data?.cadenaValorID ?? data?.CadenaValorID;
    const listaCdaRaw = data?.listacda ?? data?.listaCda ?? data?.ListaCda ?? [];

    const listaCda = listaCdaRaw.map(item => ({
      CdaID: item?.cdaid ?? item?.CdaID ?? item?.CdaId,
      ValorComparacion: item?.valorcomparacion ?? item?.ValorComparacion ?? ""
    }));

    return {
      CadenaValorID: cadenaValorID,
      ListaCda: listaCda,
    };
  },
};

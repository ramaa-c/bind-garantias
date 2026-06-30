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
    const rawList = data?.listaCda ?? data?.ListaCda ?? data?.listacda ?? [];
    const mappedList = rawList.map((item) => ({
      CdaID: item?.cdaID ?? item?.CdaID ?? item?.cdaid ?? item?.CdaId,
      ValorComparacion: item?.valorComparacion ?? item?.ValorComparacion ?? item?.valorcomparacion,
    }));
    return {
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID ?? data?.cadenavalorid,
      ListaCda: mappedList,
    };
  },
};

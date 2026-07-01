export const cdaAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      CdaID: data?.cdaID ?? data?.CdaID ?? data?.cdaid,
      Descripcion: data?.descripcion ?? data?.Descripcion,
      Expresion: data?.expresion ?? data?.Expresion,
      ExpresionLog: data?.expresionLog ?? data?.ExpresionLog ?? data?.expresionlog,
      MensajeRechazo: data?.mensajeRechazo ?? data?.MensajeRechazo ?? data?.mensajerechazo,
      SimboloComparacion: data?.simboloComparacion ?? data?.SimboloComparacion ?? data?.simbolocomparacion,
      ValorComparacion: data?.valorComparacion ?? data?.ValorComparacion ?? data?.valorcomparacion,
      VinculaDefaultCV: data?.vinculaDefaultCV ?? data?.VinculaDefaultCV ?? data?.vinculadefaultcv,
    };
  },
};

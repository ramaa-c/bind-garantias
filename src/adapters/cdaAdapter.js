export const cdaAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      CdaID: data?.cdaID ?? data?.CdaID,
      Descripcion: data?.descripcion ?? data?.Descripcion,
      Expresion: data?.expresion ?? data?.Expresion,
      ExpresionLog: data?.expresionLog ?? data?.ExpresionLog,
      MensajeRechazo: data?.mensajeRechazo ?? data?.MensajeRechazo,
      SimboloComparacion: data?.simboloComparacion ?? data?.SimboloComparacion,
      ValorComparacion: data?.valorComparacion ?? data?.ValorComparacion,
      VinculaDefaultCV: data?.vinculaDefaultCV ?? data?.VinculaDefaultCV,
    };
  },
};

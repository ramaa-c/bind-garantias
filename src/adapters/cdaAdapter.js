import { normalizarClaves } from "../utils/normalizarClaves";

export const cdaAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CdaID: d.cdaid,
      Descripcion: d.descripcion,
      Expresion: d.expresion,
      ExpresionLog: d.expresionlog,
      MensajeRechazo: d.mensajerechazo,
      SimboloComparacion: d.simbolocomparacion,
      ValorComparacion: d.valorcomparacion,
      VinculaDefaultCV: d.vinculadefaultcv,
    };
  },
};

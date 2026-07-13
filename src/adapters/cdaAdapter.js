import { normalizarClaves } from "../utils/normalizarClaves";

export const cdaAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      CdaID: d.cdaid,
      Descripcion: d.descripcion,
      Expresion: d.expresion,
      ExpresionLog: d.expresionlog,
      MensajeRechazo: d.mensajerechazo,
      SimboloComparacion: d.simbolocomparacion,
      ValorComparacion: d.valorcomparacion,
      VinculaDefaultCV: d.vinculadefaultcv,
      // "1" activo / "0" inactivo. Es el reemplazo del borrado físico: un CDA
      // en "0" se comporta como eliminado (se filtra de todas las listas).
      Activo: d.activo ?? "1",
    };
    if (d.usuariowebid !== undefined && d.usuariowebid !== null) {
      payload.UsuarioWebID = d.usuariowebid;
    }
    // Momento lo completa el backend automáticamente; no se manda.
    return payload;
  },
};

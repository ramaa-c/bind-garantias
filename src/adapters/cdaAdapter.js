import { normalizarClaves } from "../utils/normalizarClaves";
import { momentoActual } from "../utils/momentoUtils";

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
      // El backend NO lo completa solo pese a lo que se dijo en un
      // principio: si no se manda, guarda con una fecha vieja.
      Momento: momentoActual(),
    };
    if (d.usuariowebid !== undefined && d.usuariowebid !== null) {
      payload.UsuarioWebID = d.usuariowebid;
    }
    return payload;
  },

  // POST/PUT api/cda/GrupoCda - Grupo de CDAs para una combinación
  // (Pantalla, CadenaValorID), con su propia ExpresionAgrupacion.
  adaptarGrupoCda: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      PantallaGrupoCdaID: d.pantallagrupocdaid,
      CadenaValorID: d.cadenavalorid,
      ExpresionAgrupacion: d.expresionagrupacion ?? "",
      Momento: momentoActual(),
    };
    if (d.grupocdaid !== undefined && d.grupocdaid !== null) {
      payload.GrupoCdaID = d.grupocdaid;
    }
    return payload;
  },

  // POST/PUT api/cda/PantallaGrupoCda - Registro de la pantalla en sí
  // (literal). Ya no lleva ExpresionAgrupacion (se movió a GrupoCda).
  adaptarPantallaGrupoCda: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      Pantalla: d.pantalla,
    };
    if (d.pantallagrupocdaid !== undefined && d.pantallagrupocdaid !== null) {
      payload.PantallaGrupoCdaID = d.pantallagrupocdaid;
    }
    return payload;
  },
};

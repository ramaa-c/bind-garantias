import { normalizarClaves } from "../utils/normalizarClaves";
import { momentoActual } from "../utils/momentoUtils";

// Vinculación de CDAs a una Línea (TipoLimite), espejo de cadenaValorAdapter
// pero sin CadenaValorID: el backend todavía no expone estos endpoints, se
// asumen análogos a los de cadenavalor/cdas reemplazando CadenaValorID por
// TipoLimiteID. Ajustar cuando Victor confirme la forma real.
export const tipoLimiteCdaAdapter = {
  // POST/PUT api/cda/GrupoCda - Grupo de CDAs para una combinación
  // (Pantalla, TipoLimiteID), con su propia ExpresionAgrupacion.
  adaptarGrupoCda: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      PantallaGrupoCdaID: d.pantallagrupocdaid,
      TipoLimiteID: d.tipolimiteid,
      ExpresionAgrupacion: d.expresionagrupacion ?? "",
      Momento: momentoActual(),
    };
    if (d.grupocdaid !== undefined && d.grupocdaid !== null) {
      payload.GrupoCdaID = d.grupocdaid;
    }
    return payload;
  },

  // POST api/tipolimite/cdas - Agrega CDAs nuevos a un GrupoCda de línea.
  adaptarVinculacionGrupo: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const listaCdaRaw = d.listacda ?? [];

    const listaCda = listaCdaRaw.map((item) => {
      const i = normalizarClaves(item);
      const cdaItem = {
        CdaID: i.cdaid,
        ValorComparacion: i.valorcomparacion ?? "",
        Activo: i.activo ?? "1",
        Momento: momentoActual(),
      };
      if (i.usuariowebid !== undefined && i.usuariowebid !== null) {
        cdaItem.UsuarioWebID = i.usuariowebid;
      }
      return cdaItem;
    });

    return {
      GrupoCdaID: d.grupocdaid,
      ListaCda: listaCda,
    };
  },

  // PUT api/cda/tipolimite-actualizar - Modifica UNA vinculación CDA<->Grupo
  // de línea existente (requiere CdaTipoLimiteID).
  adaptarActualizarVinculacion: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      CdaTipoLimiteID: d.cdatipolimiteid,
      CdaID: d.cdaid,
      GrupoCdaID: d.grupocdaid,
      ValorComparacion: d.valorcomparacion ?? "",
      Activo: d.activo ?? "1",
      Momento: momentoActual(),
    };
    if (d.usuariowebid !== undefined && d.usuariowebid !== null) {
      payload.UsuarioWebID = d.usuariowebid;
    }
    return payload;
  },
};

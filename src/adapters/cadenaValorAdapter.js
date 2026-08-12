import { normalizarClaves } from "../utils/normalizarClaves";
import { momentoActual } from "../utils/momentoUtils";

export const cadenaValorAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CadenaValorID: d.cadenavalorid,
      Denominacion: d.denominacion,
      Referencia: d.referencia,
      Logo: d.logo,
      TipoCanalComercializacionID: d.tipocanalcomercializacionid,
      EquipoComercialID: d.equipocomercialid,
      TipoContratoID: d.tipocontratoid,
      MontoMaximo: d.montomaximo,
      MonedaID: d.monedaid,
      PorcentajeMaximoUtilizado: d.porcentajemaximoutilizado,
      MontoMaximoUtilizado: d.montomaximoutilizado,
      Activa: d.activa,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CadenaValorID: d.cadenavalorid,
      Denominacion: d.denominacion,
      Referencia: d.referencia,
      Logo: d.logo,
      TipoCanalComercializacionID: d.tipocanalcomercializacionid,
      EquipoComercialID: d.equipocomercialid,
      TipoContratoID: d.tipocontratoid,
      MontoMaximo: d.montomaximo,
      MonedaID: d.monedaid,
      PorcentajeMaximoUtilizado: d.porcentajemaximoutilizado,
      MontoMaximoUtilizado: d.montomaximoutilizado,
      Activa: d.activa,
    };
  },
  // POST /api/cadenavalor/cdas - Agrega CDAs a un GrupoCda (Pantalla x
  // Cadena) ya existente. Ya no lleva CadenaValorID directo: la cadena está
  // implícita en el GrupoCdaID.
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
  // PUT /api/cda/cadenavalor:actualizar - Modifica UNA vinculación CDA<->Grupo
  // existente. "Activo" ("1"/"0") es el equivalente a vincular/desvincular
  // sin borrar la fila.
  adaptarActualizarVinculacion: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      CdaCadenaValorID: d.cdacadenavalorid,
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

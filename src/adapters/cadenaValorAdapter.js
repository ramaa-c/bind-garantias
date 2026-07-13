import { normalizarClaves } from "../utils/normalizarClaves";

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
      MontoMaximo: d.montomaximo,
      PorcentajeMaximo: d.porcentajemaximo,
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
      MontoMaximo: d.montomaximo,
      PorcentajeMaximo: d.porcentajemaximo,
      Activa: d.activa,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const listaCdaRaw = d.listacda ?? [];

    const listaCda = listaCdaRaw.map((item) => {
      const i = normalizarClaves(item);
      return {
        CdaID: i.cdaid,
        ValorComparacion: i.valorcomparacion ?? "",
      };
    });

    return {
      CadenaValorID: d.cadenavalorid,
      ListaCda: listaCda,
    };
  },
  // PUT /api/cadenavalor/cdas - Modifica UNA vinculación CDA<->Cadena existente
  // (a diferencia del POST, que ahora solo agrega vinculaciones nuevas).
  // "Activo" ("1"/"0") es el equivalente a vincular/desvincular sin borrar la fila.
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const payload = {
      CdaCadenaValorID: d.cdacadenavalorid,
      CadenaValorID: d.cadenavalorid,
      CdaID: d.cdaid,
      ValorComparacion: d.valorcomparacion ?? "",
      Activo: d.activo ?? "1",
    };
    if (d.usuariowebid !== undefined && d.usuariowebid !== null) {
      payload.UsuarioWebID = d.usuariowebid;
    }
    return payload;
  },
};

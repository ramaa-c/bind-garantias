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
};

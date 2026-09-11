import { normalizarClaves } from "../utils/normalizarClaves";

export const tipoRelacionSocioAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoRelacionSocioID: d.tiporelacionsocioid,
      Descripcion: d.descripcion,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoRelacionSocioID: d.tiporelacionsocioid,
      Descripcion: d.descripcion,
    };
  },
};

export default tipoRelacionSocioAdapter;

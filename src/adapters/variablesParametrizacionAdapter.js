import { normalizarClaves } from "../utils/normalizarClaves";

export const variablesParametrizacionAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      Variable: d.variable,
      Valor: Number(d.valor),
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      VariablesParametrizacionID: d.variablesparametrizacionid,
      Variable: d.variable,
      Valor: Number(d.valor),
    };
  },
};

export default variablesParametrizacionAdapter;

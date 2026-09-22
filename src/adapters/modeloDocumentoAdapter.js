import { normalizarClaves } from "../utils/normalizarClaves";

export const modeloDocumentoAdapter = {
  // POST /api/ModeloDocumentoPDF
  adaptarPayloadGenerarPDF: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    const parametrosRaw = d.parametros ?? [];

    const Parametros = parametrosRaw.map((item) => {
      const i = normalizarClaves(item);
      return {
        Campo: i.campo,
        Tipo: i.tipo,
        Valor: i.valor,
      };
    });

    return {
      ModeloID: d.modeloid,
      Parametros,
    };
  },
};

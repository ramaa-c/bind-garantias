import { normalizarClaves } from "../utils/normalizarClaves";

const adaptar = (data) => {
  if (!data) return data;
  const d = normalizarClaves(data);
  return {
    TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
    Descripcion: d.descripcion,
  };
};

export const tipoDocumentoArchivoAdapter = {
  adaptarAlta: adaptar,
  adaptarEdicion: adaptar,
};

export default tipoDocumentoArchivoAdapter;

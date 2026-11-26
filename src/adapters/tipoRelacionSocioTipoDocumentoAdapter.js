import { normalizarClaves } from "../utils/normalizarClaves";

const adaptar = (data) => {
  if (!data) return data;
  const d = normalizarClaves(data);
  return {
    TipoRelacionSocioID: Number(d.tiporelacionsocioid),
    TipoDocumentoArchivoID: Number(d.tipodocumentoarchivoid),
    Requerimiento: String(d.requerimiento),
  };
};

export const tipoRelacionSocioTipoDocumentoAdapter = {
  adaptarAlta: adaptar,
  adaptarEdicion: adaptar,
};

export default tipoRelacionSocioTipoDocumentoAdapter;

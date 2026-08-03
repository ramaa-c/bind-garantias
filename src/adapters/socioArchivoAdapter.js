import { normalizarClaves } from "../utils/normalizarClaves";

export const socioArchivoAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioArchivoID: d.socioarchivoid,
      SocioID: d.socioid,
      fchArchivo: d.fcharchivo,
      Descripcion: d.descripcion,
      Contenido: d.contenido,
      NombreArchivo: d.nombrearchivo,
      TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
      AzureID: d.azureid,
      ViaLufe: d.vialufe,
      fchReferencia: d.fchreferencia,
      Referencia: d.referencia,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioArchivoID: d.socioarchivoid,
      SocioID: d.socioid,
      fchArchivo: d.fcharchivo,
      Descripcion: d.descripcion,
      Contenido: d.contenido,
      NombreArchivo: d.nombrearchivo,
      TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
      AzureID: d.azureid,
      ViaLufe: d.vialufe,
      fchReferencia: d.fchreferencia,
      Referencia: d.referencia,
    };
  },
};

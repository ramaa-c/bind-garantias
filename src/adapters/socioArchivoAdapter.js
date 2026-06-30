export const socioArchivoAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      SocioArchivoID: data?.socioArchivoID ?? data?.SocioArchivoID,
      SocioID: data?.socioID ?? data?.SocioID,
      fchArchivo: data?.fchArchivo ?? data?.fchArchivo,
      Descripcion: data?.descripcion ?? data?.Descripcion,
      Contenido: data?.contenido ?? data?.Contenido,
      NombreArchivo: data?.nombreArchivo ?? data?.NombreArchivo,
      TipoDocumentoArchivoID: data?.tipoDocumentoArchivoID ?? data?.TipoDocumentoArchivoID,
      AzureID: data?.azureID ?? data?.AzureID,
      ViaLufe: data?.viaLufe ?? data?.ViaLufe,
      fchReferencia: data?.fchReferencia ?? data?.fchReferencia,
      Referencia: data?.referencia ?? data?.Referencia,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    return {
      SocioArchivoID: data?.socioArchivoID ?? data?.SocioArchivoID,
      SocioID: data?.socioID ?? data?.SocioID,
      fchArchivo: data?.fchArchivo ?? data?.fchArchivo,
      Descripcion: data?.descripcion ?? data?.Descripcion,
      Contenido: data?.contenido ?? data?.Contenido,
      NombreArchivo: data?.nombreArchivo ?? data?.NombreArchivo,
      TipoDocumentoArchivoID: data?.tipoDocumentoArchivoID ?? data?.TipoDocumentoArchivoID,
      AzureID: data?.azureID ?? data?.AzureID,
      ViaLufe: data?.viaLufe ?? data?.ViaLufe,
      fchReferencia: data?.fchReferencia ?? data?.fchReferencia,
      Referencia: data?.referencia ?? data?.Referencia,
    };
  },
};

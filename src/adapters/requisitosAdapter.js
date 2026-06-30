export const requisitosAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    return {
      CadenaValorParametroID: data?.cadenaValorParametroID ?? data?.CadenaValorParametroID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      TipoPersonaID: data?.tipoPersonaID ?? data?.TipoPersonaID,
      TipoDocumentoArchivoID: data?.tipoDocumentoArchivoID ?? data?.TipoDocumentoArchivoID,
      TipoRelacionSocioID: data?.tipoRelacionSocioID ?? data?.TipoRelacionSocioID,
      Requerimiento: data?.requerimiento ?? data?.Requerimiento,
      TipoSociedad: data?.tipoSociedad ?? data?.TipoSociedad,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    return {
      CadenaValorParametroID: data?.cadenaValorParametroID ?? data?.CadenaValorParametroID,
      CadenaValorID: data?.cadenaValorID ?? data?.CadenaValorID,
      TipoPersonaID: data?.tipoPersonaID ?? data?.TipoPersonaID,
      TipoDocumentoArchivoID: data?.tipoDocumentoArchivoID ?? data?.TipoDocumentoArchivoID,
      TipoRelacionSocioID: data?.tipoRelacionSocioID ?? data?.TipoRelacionSocioID,
      Requerimiento: data?.requerimiento ?? data?.Requerimiento,
      TipoSociedad: data?.tipoSociedad ?? data?.TipoSociedad,
    };
  },
};

import { normalizarClaves } from "../utils/normalizarClaves";

export const requisitosAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CadenaValorParametroID: d.cadenavalorparametroid,
      CadenaValorID: d.cadenavalorid,
      TipoPersonaID: d.tipopersonaid,
      TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
      TipoRelacionSocioID: d.tiporelacionsocioid,
      Requerimiento: d.requerimiento,
      TipoSociedad: d.tiposociedad,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CadenaValorParametroID: d.cadenavalorparametroid,
      CadenaValorID: d.cadenavalorid,
      TipoPersonaID: d.tipopersonaid,
      TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
      TipoRelacionSocioID: d.tiporelacionsocioid,
      Requerimiento: d.requerimiento,
      TipoSociedad: d.tiposociedad,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CadenaValorParametroID: d.cadenavalorparametroid,
      CadenaValorID: d.cadenavalorid,
      TipoPersonaID: d.tipopersonaid,
      TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
      TipoRelacionSocioID: d.tiporelacionsocioid,
      Requerimiento: d.requerimiento,
      TipoSociedad: d.tiposociedad,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      CadenaValorParametroID: d.cadenavalorparametroid,
      CadenaValorID: d.cadenavalorid,
      TipoPersonaID: d.tipopersonaid,
      TipoDocumentoArchivoID: d.tipodocumentoarchivoid,
      TipoRelacionSocioID: d.tiporelacionsocioid,
      Requerimiento: d.requerimiento,
      TipoSociedad: d.tiposociedad,
    };
  },
};

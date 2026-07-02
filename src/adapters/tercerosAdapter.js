import { normalizarClaves } from "../utils/normalizarClaves";

export const tercerosAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TerceroRelacionadoID: d.tercerorelacionadoid,
      Denominacion: d.denominacion,
      Cuit: d.cuit,
      BcraId: d.bcraid,
      TipoPersonaID: d.tipopersonaid,
      TipoDocumentoID: d.tipodocumentoid,
      NumeroDocumento: d.numerodocumento,
      EstadoCivilID: d.estadocivilid,
      CiudadID: d.ciudadid,
      Telefono: d.telefono,
      Conyuge: d.conyuge,
      Actividad: d.actividad,
      Contacto: d.contacto,
      NroCuenta: d.nrocuenta,
      CodigoMercado: d.codigomercado,
      Calle: d.calle,
      Numero: d.numero,
      Piso: d.piso,
      Departamento: d.departamento,
      CodPos: d.codpos,
      DescripcionReducida: d.descripcionreducida,
      Mail: d.mail,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TerceroRelacionadoID: d.tercerorelacionadoid,
      Denominacion: d.denominacion,
      Cuit: d.cuit,
      BcraId: d.bcraid,
      TipoPersonaID: d.tipopersonaid,
      TipoDocumentoID: d.tipodocumentoid,
      NumeroDocumento: d.numerodocumento,
      EstadoCivilID: d.estadocivilid,
      CiudadID: d.ciudadid,
      Telefono: d.telefono,
      Conyuge: d.conyuge,
      Actividad: d.actividad,
      Contacto: d.contacto,
      NroCuenta: d.nrocuenta,
      CodigoMercado: d.codigomercado,
      Calle: d.calle,
      Numero: d.numero,
      Piso: d.piso,
      Departamento: d.departamento,
      CodPos: d.codpos,
      DescripcionReducida: d.descripcionreducida,
      Mail: d.mail,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioID: d.socioid,
      TercerosRelacionados: d.tercerosrelacionados,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioTerceroRelacionID: d.sociotercerorelacionid,
      SocioID: d.socioid,
      TerceroID: d.terceroid,
      TipoRelacionSocioID: d.tiporelacionsocioid,
      FechaDesde: d.fechadesde,
      FechaHasta: d.fechahasta,
      PorcAcciones: d.porcacciones,
      NroInscripcion: d.nroinscripcion,
      CondicionesComerciales: d.condicionescomerciales,
      CBU: d.cbu,
      ProvinciaID: d.provinciaid,
      NroSubcuentaCaja: d.nrosubcuentacaja,
      SucursalID: d.sucursalid,
      Default: d.default,
      SubTipoRelacionSocioID: d.subtiporelacionsocioid,
      Telefono: d.telefono,
      Momento: d.momento,
    };
  },
};

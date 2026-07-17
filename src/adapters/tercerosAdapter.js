import { normalizarClaves } from "../utils/normalizarClaves";

// El backend NO es case-insensitive para los items de TercerosRelacionados
// (a diferencia del top-level, que sí lo tolera): mandarlos en minúscula
// hace que el deserializer de Delphi no reconozca los campos y termine
// tratando la fila como un alta nueva (confirmado en vivo: con casing
// correcto el PUT devuelve 200, con minúscula rompe con un 500 de
// IDENTITY_INSERT sobre TerceroRelacionado).
const mapearItemRelacion = (item) => {
  const r = normalizarClaves(item);
  return {
    SocioTerceroRelacionID: r.sociotercerorelacionid,
    SocioID: r.socioid,
    TerceroID: r.terceroid,
    TipoRelacionSocioID: r.tiporelacionsocioid,
    FechaDesde: r.fechadesde,
    FechaHasta: r.fechahasta,
    PorcAcciones: r.porcacciones,
    NroInscripcion: r.nroinscripcion,
    CondicionesComerciales: r.condicionescomerciales,
    CBU: r.cbu,
    ProvinciaID: r.provinciaid,
    NroSubcuentaCaja: r.nrosubcuentacaja,
    SucursalID: r.sucursalid,
    Default: r.default,
    SubTipoRelacionSocioID: r.subtiporelacionsocioid,
    Telefono: r.telefono,
    Momento: r.momento,
  };
};

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
      TercerosRelacionados: Array.isArray(d.tercerosrelacionados)
        ? d.tercerosrelacionados.map(mapearItemRelacion)
        : d.tercerosrelacionados,
    };
  },
  // PUT api/SocioTerceroRelacion: pese a que el swagger documenta el body
  // como WSSocioTerceroRelacion (objeto plano), el backend en la práctica
  // solo acepta la misma forma envolvente que el POST (confirmado en vivo:
  // el body plano devuelve 400 "No se enviaron terceros relacionados").
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioID: d.socioid,
      TercerosRelacionados: Array.isArray(d.tercerosrelacionados)
        ? d.tercerosrelacionados.map(mapearItemRelacion)
        : d.tercerosrelacionados,
    };
  },
};

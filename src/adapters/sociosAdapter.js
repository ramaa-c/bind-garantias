import { normalizarClaves } from "../utils/normalizarClaves";

export const sociosAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioID: d.socioid,
      EntidadID: d.entidadid,
      TipoSocioID: d.tiposocioid,
      Cuit: d.cuit,
      Denominacion: d.denominacion,
      Calle: d.calle,
      Numero: d.numero,
      Piso: d.piso,
      Departamento: d.departamento,
      CiudadID: d.ciudadid,
      Telefono: d.telefono,
      Fax: d.fax,
      Email: d.email,
      TipoPersonaID: d.tipopersonaid,
      TipoCarteraID: d.tipocarteraid,
      SectorContableID: d.sectorcontableid,
      TipoActividadBCRAID: d.tipoactividadbcraid,
      TipoActividadSEPYMEID: d.tipoactividadsepymeid,
      MarcaVinculacion: d.marcavinculacion,
      SituacionBCRAID: d.situacionbcraid,
      FechaBaja: d.fechabaja,
      MotivoBajaID: d.motivobajaid,
      SocioEstadoId: d.socioestadoid,
      CodPos: d.codpos,
      TamanioEmpresaId: d.tamanioempresaid,
      FechaCierreEjercicio: d.fechacierreejercicio,
      Legajo: d.legajo,
      TipoRegimenIvaId: d.tiporegimenivaid,
      ActividadEspecifica: d.actividadespecifica,
      Partido: d.partido,
      Telefono2: d.telefono2,
      Telefono3: d.telefono3,
      Visitado: d.visitado,
      ScoringComercial: d.scoringcomercial,
      PartidoId: d.partidoid,
      FechaInicioActividades: d.fechainicioactividades,
      TipoActividadGlobalId: d.tipoactividadglobalid,
      TipoCanalComercializacionID: d.tipocanalcomercializacionid,
      EmailFacturacion: d.emailfacturacion,
      MinApoderadosRequeridos: d.minapoderadosrequeridos,
      TipoCondicionFianzaID: d.tipocondicionfianzaid,
      JsonCondicionFianza: d.jsoncondicionfianza,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioID: d.socioid,
      EntidadID: d.entidadid,
      TipoSocioID: d.tiposocioid,
      Cuit: d.cuit,
      Denominacion: d.denominacion,
      Calle: d.calle,
      Numero: d.numero,
      Piso: d.piso,
      Departamento: d.departamento,
      CiudadID: d.ciudadid,
      Telefono: d.telefono,
      Fax: d.fax,
      Email: d.email,
      TipoPersonaID: d.tipopersonaid,
      TipoCarteraID: d.tipocarteraid,
      SectorContableID: d.sectorcontableid,
      TipoActividadBCRAID: d.tipoactividadbcraid,
      TipoActividadSEPYMEID: d.tipoactividadsepymeid,
      MarcaVinculacion: d.marcavinculacion,
      SituacionBCRAID: d.situacionbcraid,
      FechaBaja: d.fechabaja,
      MotivoBajaID: d.motivobajaid,
      SocioEstadoId: d.socioestadoid,
      CodPos: d.codpos,
      TamanioEmpresaId: d.tamanioempresaid,
      FechaCierreEjercicio: d.fechacierreejercicio,
      Legajo: d.legajo,
      TipoRegimenIvaId: d.tiporegimenivaid,
      ActividadEspecifica: d.actividadespecifica,
      Partido: d.partido,
      Telefono2: d.telefono2,
      Telefono3: d.telefono3,
      Visitado: d.visitado,
      ScoringComercial: d.scoringcomercial,
      PartidoId: d.partidoid,
      FechaInicioActividades: d.fechainicioactividades,
      TipoActividadGlobalId: d.tipoactividadglobalid,
      TipoCanalComercializacionID: d.tipocanalcomercializacionid,
      EmailFacturacion: d.emailfacturacion,
      MinApoderadosRequeridos: d.minapoderadosrequeridos,
      TipoCondicionFianzaID: d.tipocondicionfianzaid,
      JsonCondicionFianza: d.jsoncondicionfianza,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      UsuarioWebID: d.usuariowebid,
      SocioID: d.socioid,
      momentoCreacion: d.momentocreacion,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioID: d.socioid,
    };
  },
  // WSSocioCertificadoPYME (api/Socio/CertificadoPYME) — ojo, fchDesde y
  // fchHasta van en camelCase, no PascalCase (confirmado en el swagger,
  // mismo tipo de inconsistencia que momentoCreacion en adaptarPayload3).
  adaptarPayload5: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SocioCertificadoPYMEID: d.sociocertificadopymeid,
      SocioID: d.socioid,
      fchDesde: d.fchdesde,
      fchHasta: d.fchhasta,
      TipoActividadGlobalId: d.tipoactividadglobalid,
      TamanioEmpresaId: d.tamanioempresaid,
      Numero: d.numero,
      Observaciones: d.observaciones,
      UsuarioID: d.usuarioid,
    };
  },
};

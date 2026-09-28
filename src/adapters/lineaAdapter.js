import { normalizarClaves } from "../utils/normalizarClaves";

export const lineaAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoLimiteSocioID: d.tipolimitesocioid,
      SocioID: d.socioid,
      TipoLimiteID: d.tipolimiteid,
      fchVigenciaDesde: d.fchvigenciadesde,
      fchVigenciaHasta: d.fchvigenciahasta,
      MonedaId: d.monedaid,
      ImporteLimite: d.importelimite,
      ImporteUtilizado: d.importeutilizado,
      TipoLimiteEstadoID: d.tipolimiteestadoid,
      Observaciones: d.observaciones,
      TerceroMercadoId: d.terceromercadoid,
      TerceroPresentanteId: d.terceropresentanteid,
      DestFondosID: d.destfondosid,
      TipoComisionId: d.tipocomisionid,
      PorcentajeComision: d.porcentajecomision,
      SucursalId: d.sucursalid,
      ImporteCargado: d.importecargado,
      AvalId: d.avalid,
      Propuesta: d.propuesta,
      Resolucion: d.resolucion,
      TipoLimiteSolicitudID: d.tipolimitesolicitudid,
      ImporteMonex: d.importemonex,
      TipoLibradorID: d.tipolibradorid,
      ContratoID: d.contratoid,
      CadenaValorID: d.cadenavalorid,
      // Único campo de todo TipoLimiteSocio con "id" en minúscula en vez de
      // "ID" (confirmado en vivo: con "EquipoComercialID" el backend acepta
      // el PUT/POST pero descarta el valor y persiste 0 - con "EquipoComercialid"
      // sí lo guarda). No es un error de tipeo nuestro, es el nombre real
      // del campo en el backend.
      EquipoComercialid: d.equipocomercialid,
      SolicitudID: d.solicitudid,
      TipoLimiteRiesgoID: d.tipolimiteriesgoid,
      TerceroViaId: d.terceroviaid,
      TerceroGeneradorID: d.tercerogeneradorid,
    };
  },
  adaptarPayload2: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoLimiteCadenaValorID: d.tipolimitecadenavalorid,
      CadenaValorID: d.cadenavalorid,
      TipoLimiteID: d.tipolimiteid,
      Descripcion: d.descripcion,
      MontoLinea: d.montolinea,
      MontoContrato: d.montocontrato,
      ValoresPorDefecto: d.valorespordefecto ?? "",
      MonedaLineaID: d.monedalineaid,
      DiasVigenciaLinea: d.diasvigencialinea,
      MonedaContratoID: d.monedacontratoid,
      DiasVigenciaContrato: d.diasvigenciacontrato,
      AptaNuevaLinea: d.aptanuevalinea,
      Activa: d.activa,
    };
  },
  adaptarPayload3: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoLimiteCadenaValorID: d.tipolimitecadenavalorid,
      CadenaValorID: d.cadenavalorid,
      TipoLimiteID: d.tipolimiteid,
      Descripcion: d.descripcion,
      MontoLinea: d.montolinea,
      MontoContrato: d.montocontrato,
      ValoresPorDefecto: d.valorespordefecto ?? "",
      MonedaLineaID: d.monedalineaid,
      DiasVigenciaLinea: d.diasvigencialinea,
      MonedaContratoID: d.monedacontratoid,
      DiasVigenciaContrato: d.diasvigenciacontrato,
      AptaNuevaLinea: d.aptanuevalinea,
      Activa: d.activa,
    };
  },
  adaptarPayload4: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoObligacionTipoLimiteID: d.tipoobligaciontipolimiteid,
      TipoObligacionID: d.tipoobligacionid,
      TipoLimiteID: d.tipolimiteid,
      Descripcion: d.descripcion,
    };
  },
  adaptarPayload5: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoObligacionTipoLimiteID: d.tipoobligaciontipolimiteid,
      TipoObligacionID: d.tipoobligacionid,
      TipoLimiteID: d.tipolimiteid,
      Descripcion: d.descripcion,
    };
  },
  adaptarPayload6: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TipoLimiteSocioID: d.tipolimitesocioid,
    };
  },
};

import { normalizarClaves } from "../utils/normalizarClaves";

export const solicitudesAdapter = {
  adaptarPayload1: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      SolicitudEnProcesoID: d.solicitudenprocesoid,
      FechaCarga: d.fechacarga,
      Cuit: d.cuit,
      TipoLimiteID: d.tipolimiteid,
      CadenaValorID: d.cadenavalorid,
      MonedaID: d.monedaid,
      Importe: d.importe,
      EstadoSolicitud: d.estadosolicitud,
      IDExterno: d.idexterno,
      TerceroViaID: d.terceroviaid,
    };
  },
};

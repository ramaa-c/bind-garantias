import { normalizarClaves } from "../utils/normalizarClaves";

export const usuarioVinculacionAdapter = {
  adaptarInvitacion: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      Cuit: String(d.cuit ?? "").replace(/\D/g, ""),
      EMail: d.email,
      Denominacion: d.denominacion || undefined,
      FrontURL: d.fronturl,
    };
  },
};

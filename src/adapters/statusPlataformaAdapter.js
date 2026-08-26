import { normalizarClaves } from "../utils/normalizarClaves";

export const statusPlataformaAdapter = {
  adaptarPayload: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      StatusPlataformaID: d.statusplataformaid ?? 0,
      StatusGeneral: String(d.statusgeneral ?? "1"),
      IntegracionSGRPlus: String(d.integracionsgrplus ?? "1"),
      IntegracionCasfog: String(d.integracioncasfog ?? "1"),
      IntegracionLufe: String(d.integracionlufe ?? "1"),
      IntegracionArca: String(d.integracionarca ?? "1"),
      IntegracionNosis: String(d.integracionnosis ?? "1"),
      IntegracionSMS: String(d.integracionsms ?? "1"),
      UsuarioWebID: d.usuariowebid ?? 0,
      Momento: d.momento,
    };
  },
};

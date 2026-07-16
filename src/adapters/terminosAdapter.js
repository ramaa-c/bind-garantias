import { normalizarClaves } from "../utils/normalizarClaves";

export const terminosAdapter = {
  adaptarTerminosyCondiciones: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      TerminosyCondicionesID: d.terminosycondicionesid ?? 0,
      TextoTyC: d.textotyc,
      UsuarioWebID: d.usuariowebid,
      Momento: d.momento,
    };
  },
  adaptarConfirmaTyC: (data) => {
    if (!data) return data;
    const d = normalizarClaves(data);
    return {
      UsuarioConfirmaTyCID: d.usuarioconfirmatycid ?? 0,
      UsuarioWebID: d.usuariowebid,
      TerminosyCondicionesID: d.terminosycondicionesid,
      ContenidoTyC: d.contenidotyc,
      Momento: d.momento,
    };
  },
};

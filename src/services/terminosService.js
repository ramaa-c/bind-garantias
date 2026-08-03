import api from "../api/axios";
import { terminosAdapter } from "../adapters/terminosAdapter";

// Pese a que el swagger documenta el GET como devolviendo un objeto único,
// en la práctica devuelve un array (confirmado en vivo) y cada POST agrega
// una fila nueva en vez de actualizar in-place: "la vigente"/"la última" es
// la más nueva. Se ordena por ID (autoincremental) y no por Momento: se
// confirmó en vivo que el backend de TerminosyCondiciones NO completa
// Momento solo (a diferencia de otros dominios del proyecto) — queda en
// null si no se lo mandamos nosotros, así que no es un campo confiable
// para determinar el orden.
const tomarUltimo = (data) => {
  const lista = Array.isArray(data) ? data : data ? [data] : [];
  if (lista.length === 0) return null;

  const getId = (row) =>
    Number(
      row.terminosycondicionesid ?? row.TerminosyCondicionesID ??
      row.usuarioconfirmatycid ?? row.UsuarioConfirmaTyCID ?? 0,
    );

  return [...lista].sort((a, b) => getId(b) - getId(a))[0];
};

// Formato "2026-01-01T00:00:00" (sin milisegundos ni offset), mismo
// criterio que usa el resto del proyecto para mandar Momento explícito.
const ahoraISO = () => new Date().toISOString().split(".")[0];

export const terminosService = {
  obtenerTerminosVigentes: async () => {
    const { data } = await api.get("api/TerminosyCondiciones");
    return tomarUltimo(data);
  },

  publicarTerminos: async (payload) => {
    const { data } = await api.post(
      "api/TerminosyCondiciones",
      terminosAdapter.adaptarTerminosyCondiciones({ ...payload, momento: ahoraISO() }),
    );
    return data;
  },

  obtenerConfirmacionTyC: async (usuarioId) => {
    const { data } = await api.get("api/ConfirmaTyC", {
      params: { UsuarioID: usuarioId },
    });
    return tomarUltimo(data);
  },

  confirmarTyC: async (payload) => {
    const { data } = await api.post(
      "api/ConfirmaTyC",
      terminosAdapter.adaptarConfirmaTyC({ ...payload, momento: ahoraISO() }),
    );
    return data;
  },
};

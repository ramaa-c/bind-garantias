import { cadenaValorAdapter } from "../adapters/cadenaValorAdapter";
import api from "../api/axios";

export const cadenaValorService = {
  // GET /CadenaValor/ObtenerTodas
  obtenerTodas: async (page = 1, pageSize = 10) =>
    (
      await api.get("CadenaValor/ObtenerTodas", {
        params: { page, page_size: pageSize },
      })
    ).data,

  // GET /CadenaValor/ObtenerTodas/{cursaPlataforma}
  obtenerTodasPorPlataforma: async (cursaPlataforma, page = 1, pageSize = 10) =>
    (
      await api.get(`CadenaValor/ObtenerTodas/${cursaPlataforma}`, {
        params: { page, page_size: pageSize },
      })
    ).data,

  // GET /CadenaValor/Obtener/{CadenaValorID}
  obtenerPorId: async (cadenaValorId) =>
    (await api.get(`CadenaValor/Obtener/${cadenaValorId}`)).data,

  // GET /CadenaValor/Libradores/{CadenaValorID}
  obtenerLibradores: async (cadenaValorId, page = 1, pageSize = 10) => {
    console.log(
      `Llamando Libradores Listado: ID=${cadenaValorId}, Page=${page}`,
    );
    return (
      await api.get(`CadenaValor/Libradores/${cadenaValorId}`, {
        params: { page, page_size: pageSize },
      })
    ).data;
  },

  // GET /CadenaValor/Libradores/{CadenaValorID}/{CuitLibrador}
  obtenerLibradorPorCuit: async (cadenaValorId, cuitLibrador) => {
    console.log(
      `Llamando Librador Search CUIT: ID=${cadenaValorId}, CUIT=${cuitLibrador}`,
    );
    const response = await api.get(
      `CadenaValor/Libradores/${cadenaValorId}/${cuitLibrador}`,
      {
        transformResponse: [
          (data) => {
            try {
              return JSON.parse(data);
            } catch {
              return data;
            }
          },
        ],
      },
    );
    return response.data;
  },

  // GET /CadenaValor/Lineas/{CadenaValorID}
  obtenerLineas: async (cadenaValorId, page = 1, pageSize = 10) => {
    return (
      await api.get(`CadenaValor/Lineas/${cadenaValorId}`, {
        params: { page, page_size: pageSize },
      })
    ).data;
  },

  // GET /CadenaValor/Relaciones/{CadenaValorID}/{email}
  verificarAutorizacionEmail: async (cadenaValorId, email) =>
    (await api.get(`CadenaValor/Relaciones/${cadenaValorId}/${email}`)).data,

  // GET /CadenaValor/RelacionesPorEmail/{email}
  obtenerCadenasPorEmail: async (email) =>
    (await api.get(`CadenaValor/RelacionesPorEmail/${email}`)).data,

  // GET /CadenaValor/Relaciones/{CadenaValorID}
  obtenerRelaciones: async (cadenaValorId) =>
    (await api.get(`CadenaValor/Relaciones/${cadenaValorId}`)).data,

  // GET /CadenaValor/Utilizado/{CadenaValorID}
  obtenerUtilizado: async (cadenaValorId) =>
    (await api.get(`CadenaValor/Utilizado/${cadenaValorId}`)).data,

  // GET /api/cadenavalor (Web)
  obtenerPorCadenaValorIdWeb: async (cadenaValorId) =>
    (await api.get("api/cadenavalor", { params: { CadenaValorID: cadenaValorId } })).data,

  // GET /api/cadenavalor/cdas/{CadenaID}
  obtenerCdasPorCadenaId: async (cadenaId) =>
    (await api.get(`api/cadenavalor/cdas/${cadenaId}`)).data,

  // POST /api/cadenavalor
  crearCadenaValor: async (cadenaValorData) =>
    (await api.post("api/cadenavalor", cadenaValorAdapter.adaptarPayload1(cadenaValorData))).data,

  // PUT /api/cadenavalor
  actualizarCadenaValor: async (cadenaValorData) =>
    (await api.put("api/cadenavalor", cadenaValorAdapter.adaptarPayload2(cadenaValorData))).data,

  // GET /api/cadenavalor (Web) - Obtener todas las activas
  obtenerTodasWeb: async () =>
    (await api.get("api/cadenavalor")).data,

  // POST /api/cadenavalor/cdas - Agrega vinculaciones nuevas (ya no reemplaza
  // la lista completa: hay que mandar únicamente lo que se quiere agregar).
  vincularCdas: async (vinculacionData) =>
    (await api.post("api/cadenavalor/cdas", cadenaValorAdapter.adaptarPayload3(vinculacionData))).data,

  // PUT /api/cadenavalor/cdas - Modifica el valor de UNA vinculación ya
  // existente (requiere CdaCadenaValorID); queda registrado en el historial.
  actualizarVinculacionCda: async (vinculacionData) =>
    (await api.put("api/cadenavalor/cdas", cadenaValorAdapter.adaptarPayload4(vinculacionData))).data,
};

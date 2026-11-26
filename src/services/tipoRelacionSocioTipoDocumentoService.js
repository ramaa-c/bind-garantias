import api from "../api/axios";
import { tipoRelacionSocioTipoDocumentoAdapter } from "../adapters/tipoRelacionSocioTipoDocumentoAdapter";

const ENDPOINT = "api/TipoRelacionSocioTipoDocumento";

const comoLista = (data) => (Array.isArray(data) ? data : data?.items || data?.data || data?.list || []);

export const tipoRelacionSocioTipoDocumentoService = {
  listar: async (tipoRelacionSocioId) => {
    const params = tipoRelacionSocioId ? { TipoRelacionSocioID: Number(tipoRelacionSocioId) } : undefined;
    return comoLista((await api.get(ENDPOINT, { params })).data);
  },

  crear: async (data) =>
    (await api.post(ENDPOINT, tipoRelacionSocioTipoDocumentoAdapter.adaptarAlta(data))).data,

  actualizar: async (data) =>
    (await api.put(ENDPOINT, tipoRelacionSocioTipoDocumentoAdapter.adaptarEdicion(data))).data,

  eliminar: async (tipoRelacionSocioId, tipoDocumentoArchivoId) =>
    (await api.delete(`${ENDPOINT}/${Number(tipoRelacionSocioId)}/${Number(tipoDocumentoArchivoId)}`)).data,

  guardarDeRelacion: async (tipoRelacionSocioId, valores) => {
    const relId = Number(tipoRelacionSocioId);
    const filas = await tipoRelacionSocioTipoDocumentoService.listar(relId);
    const existentes = new Map(
      filas
        .filter((f) => Number(f.tiporelacionsocioid) === relId)
        .map((f) => [Number(f.tipodocumentoarchivoid), Number(f.requerimiento)]),
    );

    for (const [docIdTexto, valor] of Object.entries(valores)) {
      const docId = Number(docIdTexto);
      const requerimiento = Number(valor);
      const actual = existentes.get(docId);
      const fila = { tiporelacionsocioid: relId, tipodocumentoarchivoid: docId, requerimiento };

      if (actual === undefined) {
        if (requerimiento === 1 || requerimiento === 2) {
          await tipoRelacionSocioTipoDocumentoService.crear(fila);
        }
      } else if (requerimiento === 0) {
        await tipoRelacionSocioTipoDocumentoService.eliminar(relId, docId);
      } else if (actual !== requerimiento) {
        await tipoRelacionSocioTipoDocumentoService.actualizar(fila);
      }
    }
  },
};

export default tipoRelacionSocioTipoDocumentoService;

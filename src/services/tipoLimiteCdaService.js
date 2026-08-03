import { tipoLimiteCdaAdapter } from "../adapters/tipoLimiteCdaAdapter";
import api from "../api/axios";

// ⚠️ Estos endpoints todavía NO existen en el backend (al momento de escribir
// esto). Se asumen por espejo directo de los ya usados para CDAs por Cadena
// (ver cadenaValorService.js / cdaService.js), reemplazando CadenaValorID por
// TipoLimiteID. Cuando Victor confirme/publique los reales (probablemente
// junto con el motor de ejecución/historial de CDAs para líneas), ajustar acá
// las rutas y, si hace falta, el shape de los payloads en
// tipoLimiteCdaAdapter.js — el resto de la pantalla (CdaLineaPanel) no debería
// necesitar cambios.
export const tipoLimiteCdaService = {
  // GET api/cda/GrupoCda?Pantalla=X&TipoLimiteID=Y
  obtenerGrupoCda: async (pantalla, tipoLimiteId) => {
    const params = { Pantalla: pantalla };
    if (tipoLimiteId !== undefined && tipoLimiteId !== null) {
      params.TipoLimiteID = tipoLimiteId;
    }
    const response = await api.get("api/cda/GrupoCda", { params });
    const data = response.data;
    if (tipoLimiteId === undefined || tipoLimiteId === null) return data;

    const list = Array.isArray(data) ? data : data?.items || data?.data || (data ? [data] : []);
    return list.filter((row) => String(row.tipolimiteid) === String(tipoLimiteId));
  },

  crearGrupoCda: async (grupoData) =>
    (await api.post("api/cda/GrupoCda", tipoLimiteCdaAdapter.adaptarGrupoCda(grupoData))).data,

  actualizarGrupoCda: async (grupoData) =>
    (await api.put("api/cda/GrupoCda", tipoLimiteCdaAdapter.adaptarGrupoCda(grupoData))).data,

  // GET api/cda/tipolimite/obtener-byGrupo?GrupoID=X - CDAs vinculados a un
  // GrupoCda de línea. Análogo a cadenaValorService.obtenerCdasPorGrupo.
  obtenerCdasPorGrupo: async (grupoId) =>
    (await api.get("api/cda/tipolimite/obtener-byGrupo", { params: { GrupoID: grupoId } })).data,

  // POST api/tipolimite/cdas - Agrega CDAs nuevos a un GrupoCda de línea.
  vincularCdasAGrupo: async (vinculacionData) =>
    (await api.post("api/tipolimite/cdas", tipoLimiteCdaAdapter.adaptarVinculacionGrupo(vinculacionData))).data,

  // PUT api/cda/tipolimite-actualizar - Modifica el valor/Activo de UNA
  // vinculación ya existente (requiere CdaTipoLimiteID).
  actualizarVinculacionCda: async (vinculacionData) =>
    (await api.put("api/cda/tipolimite-actualizar", tipoLimiteCdaAdapter.adaptarActualizarVinculacion(vinculacionData))).data,
};

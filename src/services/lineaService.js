import { lineaAdapter } from "../adapters/lineaAdapter";
import api from '../api/axios';

export const lineaService = {
    // GET api/TipoLimiteSocioCambioEstado/{TipoLimiteSocioID}
    obtenerCambiosEstado: async (tipoLimiteSocioId) => (await api.get(`api/TipoLimiteSocioCambioEstado/${tipoLimiteSocioId}`)).data,

    // GET api/TipoLimiteSocio?socioid={SocioID}
    obtenerLimitesPorSocio: async (socioId) => (await api.get(`api/TipoLimiteSocio?socioid=${socioId}`)).data,

    // GET api/TipoLimiteSocio (todas, o filtradas por CadenaValorID si se pasa)
    obtenerLimites: async (cadenavalorid) =>
        (await api.get('api/TipoLimiteSocio', {
            params: cadenavalorid ? { CadenaValorID: cadenavalorid } : {},
        })).data,

    // POST api/TipoLimiteSocio
    crearLimiteSocio: async (limiteData) => (await api.post(`api/TipoLimiteSocio`, lineaAdapter.adaptarPayload1(limiteData))).data,

    // PUT api/TipoLimiteSocio
    actualizarLimiteSocio: async (limiteData) => (await api.put(`api/TipoLimiteSocio`, lineaAdapter.adaptarPayload1(limiteData))).data,

    // GET api/TipoLimiteCadenaValor?cadenavalorid={id}
    obtenerLimitesCadenaValor: async (cadenavalorid) => 
        (await api.get('api/TipoLimiteCadenaValor', { params: { cadenavalorid } })).data,

    // POST api/TipoLimiteCadenaValor
    crearLimiteCadenaValor: async (limiteData) => 
        (await api.post('api/TipoLimiteCadenaValor', lineaAdapter.adaptarPayload2(limiteData))).data,

    // PUT api/TipoLimiteCadenaValor
    actualizarLimiteCadenaValor: async (limiteData) => 
        (await api.put('api/TipoLimiteCadenaValor', lineaAdapter.adaptarPayload3(limiteData))).data,



    // GET api/TipoObligacionTipoLimite?tipolimiteid={id}
    obtenerProductosPorLimite: async (tipolimiteid) => 
        (await api.get('api/TipoObligacionTipoLimite', { params: { tipolimiteid } })).data,

    // POST api/TipoObligacionTipoLimite
    asociarProductoLimite: async (asocData) => 
        (await api.post('api/TipoObligacionTipoLimite', lineaAdapter.adaptarPayload4(asocData))).data,

    // PUT api/TipoObligacionTipoLimite
    actualizarProductoLimite: async (asocData) => 
        (await api.put('api/TipoObligacionTipoLimite', lineaAdapter.adaptarPayload5(asocData))).data,

    // DELETE api/TipoObligacionTipoLimite/{id}
    desasociarProductoLimite: async (id) =>
        (await api.delete(`api/TipoObligacionTipoLimite/${id}`)).data,

    // POST api/Linea/Migrar - migra la línea aprobada al core SGR+.
    // Confirmado en vivo el 2026-09-15 que es idempotente (llamarlo dos
    // veces sobre la misma línea responde "Línea migrada" ambas veces, sin
    // error ni duplicado), así que se deja el reintento automático del
    // interceptor global (2 veces, con backoff) en vez de exigir un
    // reintento manual del admin - el 500 que se ve justo después de
    // aprobar suele ser el pool de FireDAC saturado por las llamadas en
    // cadena (aprobar + migrar línea + migrar socio), y el interceptor ya
    // sabe no insistir si detecta ese caso puntual (ver isPoolExhaustionError
    // en api/axios.js).
    migrarLinea: async (tipoLimiteSocioId) =>
        (await api.post(
            'api/Linea/Migrar',
            lineaAdapter.adaptarPayload6({ tipolimitesocioid: tipoLimiteSocioId }),
        )).data,
};
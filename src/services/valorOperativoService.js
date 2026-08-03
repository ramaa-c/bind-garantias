import api from "../api/axios";

// GET sgrplus/ObtenerValorOperativo/{TipoLimiteOperativoID} - catálogo de
// parámetros operativos configurables del core SGR+. El swagger documenta la
// respuesta como WSSocioTerceroRelacion (copiado de otro endpoint, mal); la
// forma real confirmada en vivo es {LimOpValId, FechaDesde, FechaHasta,
// Porcentaje, Comentario, LimiteOperativoId, Importe} — el dato que importa
// es Importe.
export const valorOperativoService = {
  obtenerValorOperativo: async (tipoLimiteOperativoId) =>
    (await api.get(`sgrplus/ObtenerValorOperativo/${tipoLimiteOperativoId}`)).data,
};

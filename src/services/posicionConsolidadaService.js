import api from "../api/axios";

export const posicionConsolidadaService = {
  obtenerContragarantiaSocio: async (socioId) => {
    const response = await api.get(`PosicionConsolidada/ObtenerContragarantiaSocio/${socioId}`);
    return response.data;
  },
  obtenerLimiteSocio: async (socioId) => {
    const response = await api.get(`PosicionConsolidada/ObtenerLimiteSocio/${socioId}`);
    return response.data;
  },

  // PosicionConsolidada/ObtenerLimiteSocio pide el SocioID del CORE
  // (SGRPlus), no el de la tabla Web — son IDs distintos. Todo socio tiene
  // una entidad espejo en el CORE resoluble por CUIT (confirmado en vivo:
  // existe aunque el socio nunca se haya migrado, con Legajo=0 en la Web).
  // Mismo patrón de resolución que ya usa
  // tercerosService.obtenerRelacionesDeSocioSGRPlus.
  obtenerLimiteSocioPorCuit: async (cuit) => {
    const cuitLimpio = String(cuit).replace(/\D/g, "");
    const response = await api.get("sgrplus/Socios", { params: { Cuit: cuitLimpio } });
    const arr = Array.isArray(response.data) ? response.data : response.data?.items || [];
    const sgrSocioId = arr[0]?.socioid;
    if (!sgrSocioId) return [];
    return posicionConsolidadaService.obtenerLimiteSocio(sgrSocioId);
  },
};

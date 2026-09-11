import api from "../api/axios";
import { tipoRelacionSocioAdapter } from "../adapters/tipoRelacionSocioAdapter";

// api/TipoRelacionSocio es la capa curada por el admin sobre el catálogo real
// de SGR+ (catalogos/TipoRelacionSocio, ver catalogosService.obtenerTipoRelacionSocio):
// mismo TipoRelacionSocioID que el catálogo real, con la Descripcion que se
// va a mostrar/usar para esa relación. El POST da de alta un ID del catálogo
// real que todavía no está curado acá; el PUT solo permite renombrarlo, no
// existe baja (confirmado con Victor - un registro cargado queda existente
// hasta que se pida un borrado manual en la base).
export const tipoRelacionSocioService = {
  obtenerActivos: async () => (await api.get("api/TipoRelacionSocio")).data,

  crear: async (data) =>
    (await api.post("api/TipoRelacionSocio", tipoRelacionSocioAdapter.adaptarPayload1(data))).data,

  actualizar: async (data) =>
    (await api.put("api/TipoRelacionSocio", tipoRelacionSocioAdapter.adaptarPayload2(data))).data,
};

export default tipoRelacionSocioService;

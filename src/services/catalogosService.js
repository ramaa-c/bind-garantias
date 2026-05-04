import api from "../api/axios";

export const catalogosService = {
  // Trae las clasificaciones de actividad según la SEPYME
  obtenerTipoActividadSEPYME: async () =>
    (await api.get("/catalogos/TipoActividadSEPYME")).data,

  // Trae los rubros de actividad regulados por el BCRA
  obtenerTipoActividadBCRA: async () =>
    (await api.get("/catalogos/TipoActividadBCRA")).data,

  // Trae las situaciones crediticias o estados de deuda según el BCRA
  obtenerSituacionBCRA: async () =>
    (await api.get("/catalogos/SituacionBRCA")).data,

  // Trae los estados posibles en los que puede encontrarse un socio
  obtenerEstadoSocio: async () =>
    (await api.get("/catalogos/EstadoSocio")).data,

  // Trae las clasificaciones por tamaño o envergadura de la empresa
  obtenerTamanioEmpresa: async () =>
    (await api.get("/catalogos/TamanioEmpresa")).data,

  // Trae los diferentes tipos de comisiones aplicables a las operaciones
  obtenerTipoComision: async () =>
    (await api.get("/catalogos/TipoComision")).data,

  // Trae los tipos de cotización disponibles para las operaciones cambiarias
  obtenerTipoCotizacion: async () =>
    (await api.get("/catalogos/TipoCotizacion")).data,

  // Trae la cotización exacta de una moneda para una fecha y tipo específico
  obtenerCotizacion: async ({ moneda, fecha, tipoCotizacion }) =>
    (
      await api.get(
        `/catalogos/Cotizacion/${moneda}/${fecha}/${tipoCotizacion}`,
      )
    ).data,

  // Trae las categorías de referencias que se le pueden pedir a un socio
  obtenerTipoReferencia: async () =>
    (await api.get("/catalogos/TipoReferencia")).data,

  // Trae las clasificaciones para identificar a terceros relacionados
  obtenerTipoTerceroRelacionado: async () =>
    (await api.get("/catalogos/TipoTerceroRelacionado")).data,

  // Trae los vínculos legales o roles que un tercero puede tener con el socio
  obtenerTipoRelacionSocio: async () =>
    (await api.get("/catalogos/TipoRelacionSocio")).data,

  // Trae los modelos o clasificaciones de contratos manejados por el sistema
  obtenerTipoContrato: async () =>
    (await api.get("/catalogos/TipoContrato")).data,

  // Trae los tipos de moneda (Pesos, Dólares, etc.)
  obtenerMonedas: async () => (await api.get("/catalogos/Moneda")).data,

  // Trae las vías o canales por donde se captan las operaciones
  obtenerTipoCanalComercializacion: async () =>
    (await api.get("/catalogos/TipoTipoCanalComercializacion")).data,

  // Trae los agrupadores de actividades a nivel global
  obtenerTipoActividadGlobal: async () =>
    (await api.get("/catalogos/TipoActividadGlobal")).data,

  // Trae las condiciones o categorías impositivas frente al IVA
  obtenerTipoRegimenIva: async () =>
    (await api.get("/catalogos/TipoRegimenIva")).data,

  // Trae los tipos de fianzas o garantías que respaldan las operaciones
  obtenerTipoCondicionFianza: async () =>
    (await api.get("/catalogos/TipoCondicionFianza")).data,

  // Trae los estados de aprobación en los que puede estar un límite crediticio
  obtenerTipoLimiteEstado: async () =>
    (await api.get("/catalogos/TipoLimiteEstado")).data,

  // Trae las categorías de riesgo asociadas a los límites otorgados
  obtenerTipoLimiteRiesgo: async () =>
    (await api.get("/catalogos/TipoLimiteRiesgo")).data,

  // Trae los tipos de límites crediticios u operativas (Tipos de Producto)
  obtenerTiposProducto: async () =>
    (await api.get("/catalogos/TipoLimite")).data,

  // Trae las clasificaciones internas para los diferentes tipos de socios
  obtenerTipoSocio: async () => (await api.get("/catalogos/tipoSocio")).data,

  // Trae el listado completo de provincias
  obtenerProvincias: async () => (await api.get("/catalogos/Provincia")).data,

  // Trae las clasificaciones de persona (Física, Jurídica, etc.)
  obtenerTipoPersona: async () =>
    (await api.get("/catalogos/TipoPersona")).data,

  // Trae los segmentos o centros de costos contables
  obtenerSectorContable: async () =>
    (await api.get("/catalogos/SectorContable")).data,

  // Trae los tipos de cartera para segmentar a los socios comercialmente
  obtenerTipoCartera: async () =>
    (await api.get("/catalogos/TipoCartera")).data,
};

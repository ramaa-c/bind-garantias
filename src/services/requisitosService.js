import api from "../api/axios";

// Configuración por defecto para Persona Física (Individual)
export const DEFAULT_PHYSICAL_CONFIG = {
  documentos: {
    estatuto: 0,
    balance: 0,
    ddjjIva: 0,
    cartasDocumento: 0,
    poderes: 0,
    certificadoPyme: 1,
    otrosDocumentos: 2,
    eecc: 0,
    actaDesignacion: 0,
    actaSocios: 0,
    f1272: 0,
    ddjjGanancias: 1,
    manifestacionBienes: 1,
    constanciaMonotributo: 1,
  },
  relaciones: {
    accionistas: 0,
    representantes: 0,
    agentesBolsa: 2,
    usuarios: 2,
  },
};

// Configuración por defecto para S.A.
export const DEFAULT_SA_CONFIG = {
  documentos: {
    estatuto: 1,
    balance: 0,
    ddjjIva: 0,
    cartasDocumento: 0,
    poderes: 1,
    certificadoPyme: 1,
    otrosDocumentos: 2,
    eecc: 1,
    actaDesignacion: 1,
    actaSocios: 0,
    f1272: 1,
    ddjjGanancias: 0,
    manifestacionBienes: 0,
    constanciaMonotributo: 0,
  },
  relaciones: {
    accionistas: 1,
    representantes: 1,
    agentesBolsa: 2,
    usuarios: 2,
  },
};

// Configuración por defecto para S.R.L.
export const DEFAULT_SRL_CONFIG = {
  ...DEFAULT_SA_CONFIG,
  documentos: {
    ...DEFAULT_SA_CONFIG.documentos,
    actaDesignacion: 0,
    actaSocios: 1,
  },
};

// Configuración por defecto para S.H.
export const DEFAULT_SH_CONFIG = {
  ...DEFAULT_SA_CONFIG,
  documentos: {
    ...DEFAULT_SA_CONFIG.documentos,
    actaDesignacion: 0,
    actaSocios: 0,
  },
};

// Configuración por defecto para OTRAS
export const DEFAULT_OTRAS_CONFIG = {
  ...DEFAULT_SA_CONFIG,
};

export const getSocTypeFromDenominacion = (denominacion) => {
  if (!denominacion) return "otras";
  const name = denominacion.toUpperCase().replace(/\./g, "");
  if (/\bSA\b/.test(name) || name.includes("S A")) return "sa";
  if (/\bSRL\b/.test(name) || name.includes("S R L")) return "srl";
  if (/\bSH\b/.test(name) || name.includes("S H")) return "sh";
  return "otras";
};

export const normalizeSociedad = (soc) => {
  const s = String(soc || "").toUpperCase().trim();
  if (s === "OTR" || s === "OTRAS" || s === "OTRAS JURÍDICAS") return "OTR";
  return s;
};

export const getFallbackConfig = (tipoPersonaId, sociedad) => {
  if (Number(tipoPersonaId) === 1) return DEFAULT_PHYSICAL_CONFIG;
  const type = getSocTypeFromDenominacion(sociedad);
  if (type === "sa") return DEFAULT_SA_CONFIG;
  if (type === "srl") return DEFAULT_SRL_CONFIG;
  if (type === "sh") return DEFAULT_SH_CONFIG;
  return DEFAULT_OTRAS_CONFIG;
};

// Mapeos a los IDs correspondientes en el catálogo
export const TIPO_DOCUMENTO_MAP = {
  estatuto: 1,
  balance: 2,
  ddjjIva: 3,
  cartasDocumento: 4,
  poderes: 5,
  certificadoPyme: 6,
  otrosDocumentos: 7,
  eecc: 10,
  actaDesignacion: 11,
  actaSocios: 12,
  f1272: 13,
  ddjjGanancias: 14,
  manifestacionBienes: 15,
  constanciaMonotributo: 16,
};

export const TIPO_RELACION_MAP = {
  accionistas: 25,
  representantes: 210,
  agentesBolsa: 21,
  usuarios: 999,
};

export const requisitosService = {
  obtenerRequisitosPorCadenaId: async (cadenaId, tipoPersonaId = null, sociedad = null, isClientMode = false) => {
    if (!cadenaId) return null;
    try {
      const params = { cadenavalorid: cadenaId };
      if (tipoPersonaId !== null) params.TipoPersonaID = tipoPersonaId;
      if (sociedad !== null) params.Sociedad = sociedad;

      const response = await api.get("api/CadenaValorParametrizacion", { params });
      const data = response.data || [];

      // Ordenar registros para que los menos específicos (legacy/globales con tipopersonaid = 0 o sin sociedad)
      // se procesen primero, y los más específicos (con sociedad o tipoPersonaId específico) se procesen al final
      // para que tengan prioridad y sobreescriban los fallbacks globales.
      const sortedData = [...data].sort((a, b) => {
        const aPersona = Number(a.tipopersonaid || 0);
        const bPersona = Number(b.tipopersonaid || 0);
        if (aPersona === 0 && bPersona !== 0) return -1;
        if (aPersona !== 0 && bPersona === 0) return 1;

        const aSoc = normalizeSociedad(a.tiposociedad);
        const bSoc = normalizeSociedad(b.tiposociedad);
        if (!aSoc && bSoc) return -1;
        if (aSoc && !bSoc) return 1;

        return 0;
      });

      // MODO CLIENTE: Si se especificó el tipo de persona o estamos en modo cliente, devolvemos un objeto de configuración plano
      if (isClientMode || tipoPersonaId !== null) {
        const resolvedTipoPersonaId = tipoPersonaId !== null ? Number(tipoPersonaId) : (getSocTypeFromDenominacion(sociedad) !== "otras" || sociedad ? 10 : 1);
        const socType = resolvedTipoPersonaId === 1 ? "" : getSocTypeFromDenominacion(sociedad);

        const fallback = getFallbackConfig(resolvedTipoPersonaId, sociedad);
        if (sortedData.length === 0) {
          return fallback;
        }

        const config = {
          documentos: { ...fallback.documentos },
          relaciones: { ...fallback.relaciones },
        };

        sortedData.forEach((item) => {
          const reqVal = Number(item.requerimiento);
          const itemPersonaId = Number(item.tipopersonaid);
          const itemSocType = normalizeSociedad(item.tiposociedad);

          // Verificar si el registro coincide con el tipo de persona y tipo de sociedad del cliente (o es un registro legacy global)
          let matches = false;
          if (resolvedTipoPersonaId === 1) {
            matches = (itemPersonaId === 1 || itemPersonaId === 0 || !item.tipopersonaid);
          } else if (resolvedTipoPersonaId === 10) {
            matches = (itemPersonaId === 10 && itemSocType === normalizeSociedad(socType)) || itemPersonaId === 0 || !item.tipopersonaid;
          }

          if (matches) {
            if (item.tipodocumentoarchivoid > 0) {
              const docKey = Object.keys(TIPO_DOCUMENTO_MAP).find(
                (k) => TIPO_DOCUMENTO_MAP[k] === item.tipodocumentoarchivoid
              );
              if (docKey) {
                config.documentos[docKey] = reqVal;
              }
            } else if (item.tiporelacionsocioid > 0) {
              const relKey = Object.keys(TIPO_RELACION_MAP).find(
                (k) => TIPO_RELACION_MAP[k] === item.tiporelacionsocioid
              );
              if (relKey) {
                config.relaciones[relKey] = reqVal;
              }
            }
          }
        });

        return config;
      }

      // MODO ADMIN: Retornar las 5 configuraciones agrupadas para las solapas
      const config = {
        fisica: JSON.parse(JSON.stringify(DEFAULT_PHYSICAL_CONFIG)),
        sa: JSON.parse(JSON.stringify(DEFAULT_SA_CONFIG)),
        srl: JSON.parse(JSON.stringify(DEFAULT_SRL_CONFIG)),
        sh: JSON.parse(JSON.stringify(DEFAULT_SH_CONFIG)),
        otras: JSON.parse(JSON.stringify(DEFAULT_OTRAS_CONFIG)),
      };

      if (sortedData.length === 0) {
        return config;
      }

      sortedData.forEach((item) => {
        const reqVal = Number(item.requerimiento);
        const tPersona = Number(item.tipopersonaid);
        const tSoc = normalizeSociedad(item.tiposociedad);

        let targetTabs = [];
        if (tPersona === 1) {
          targetTabs = ["fisica"];
        } else if (tPersona === 10) {
          if (tSoc === "SA") targetTabs = ["sa"];
          else if (tSoc === "SRL") targetTabs = ["srl"];
          else if (tSoc === "SH") targetTabs = ["sh"];
          else if (tSoc === "OTR") targetTabs = ["otras"];
          else targetTabs = ["sa", "srl", "sh", "otras"]; // legacy fallback
        } else {
          targetTabs = ["fisica", "sa", "srl", "sh", "otras"]; // legacy global fallback (tPersona === 0)
        }

        targetTabs.forEach((tab) => {
          if (item.tipodocumentoarchivoid > 0) {
            const docKey = Object.keys(TIPO_DOCUMENTO_MAP).find(
              (k) => TIPO_DOCUMENTO_MAP[k] === item.tipodocumentoarchivoid
            );
            if (docKey) {
              config[tab].documentos[docKey] = reqVal;
            }
          } else if (item.tiporelacionsocioid > 0) {
            const relKey = Object.keys(TIPO_RELACION_MAP).find(
              (k) => TIPO_RELACION_MAP[k] === item.tiporelacionsocioid
            );
            if (relKey) {
              config[tab].relaciones[relKey] = reqVal;
            }
          }
        });
      });

      return config;
    } catch (error) {
      console.error(`Error al obtener parametrización para cadena #${cadenaId}:`, error);
      if (tipoPersonaId !== null) {
        return getFallbackConfig(tipoPersonaId, sociedad);
      }
      return {
        fisica: DEFAULT_PHYSICAL_CONFIG,
        sa: DEFAULT_SA_CONFIG,
        srl: DEFAULT_SRL_CONFIG,
        sh: DEFAULT_SH_CONFIG,
        otras: DEFAULT_OTRAS_CONFIG,
      };
    }
  },

  guardarRequisitos: async (cadenaId, configuracionCompleta) => {
    if (!cadenaId) return;

    // 1. Obtener registros existentes para decidir entre POST (nuevo) o PUT (actualizar)
    let existentes = [];
    try {
      const response = await api.get("api/CadenaValorParametrizacion", {
        params: { cadenavalorid: cadenaId },
      });
      existentes = response.data || [];
    } catch (err) {
      console.warn("No se pudieron consultar parametrizaciones previas, se asumirá creación:", err);
    }

    const promises = [];
    const claimedIds = new Set();

    // Mapeo de las 5 configuraciones para guardar
    const TABS_MAPPING = [
      { tab: "fisica", tipoPersonaId: 1, tipoSociedad: "" },
      { tab: "sa", tipoPersonaId: 10, tipoSociedad: "SA" },
      { tab: "srl", tipoPersonaId: 10, tipoSociedad: "SRL" },
      { tab: "sh", tipoPersonaId: 10, tipoSociedad: "SH" },
      { tab: "otras", tipoPersonaId: 10, tipoSociedad: "OTR" },
    ];

    TABS_MAPPING.forEach(({ tab, tipoPersonaId, tipoSociedad }) => {
      const config = configuracionCompleta[tab];
      if (!config) return;

      // Procesar documentos
      Object.entries(config.documentos).forEach(([key, value]) => {
        const docId = TIPO_DOCUMENTO_MAP[key];
        if (!docId) return;

        // Intentar encontrar un registro existente coincidente
        let existente = existentes.find(
          (item) =>
            item.tipodocumentoarchivoid === docId &&
            Number(item.tiporelacionsocioid) === 0 &&
            item.tipopersonaid === tipoPersonaId &&
            normalizeSociedad(item.tiposociedad) === normalizeSociedad(tipoSociedad) &&
            !claimedIds.has(item.cadenavalorparametroid)
        );

        // Fallback a un registro legacy (tipopersonaid === 0 o vacío) para actualizarlo y evitar duplicados
        if (!existente) {
          existente = existentes.find(
            (item) =>
              item.tipodocumentoarchivoid === docId &&
              Number(item.tiporelacionsocioid) === 0 &&
              (item.tipopersonaid === 0 || !item.tipopersonaid) &&
              !claimedIds.has(item.cadenavalorparametroid)
          );
        }

        if (existente) {
          claimedIds.add(existente.cadenavalorparametroid);
        }

        const payload = {
          cadenavalorparametroid: existente ? existente.cadenavalorparametroid : 0,
          cadenavalorid: Number(cadenaId),
          tipopersonaid: tipoPersonaId,
          tipodocumentoarchivoid: docId,
          tiporelacionsocioid: 0,
          requerimiento: String(value),
          tiposociedad: tipoSociedad,
        };

        if (existente) {
          promises.push(api.put("api/CadenaValorParametrizacion", payload));
        } else {
          promises.push(api.post("api/CadenaValorParametrizacion", payload));
        }
      });

      // Procesar relaciones
      Object.entries(config.relaciones).forEach(([key, value]) => {
        const relId = TIPO_RELACION_MAP[key];
        if (!relId) return;

        // Intentar encontrar un registro existente coincidente
        let existente = existentes.find(
          (item) =>
            item.tiporelacionsocioid === relId &&
            Number(item.tipodocumentoarchivoid) === 0 &&
            item.tipopersonaid === tipoPersonaId &&
            normalizeSociedad(item.tiposociedad) === normalizeSociedad(tipoSociedad) &&
            !claimedIds.has(item.cadenavalorparametroid)
        );

        // Fallback a un registro legacy
        if (!existente) {
          existente = existentes.find(
            (item) =>
              item.tiporelacionsocioid === relId &&
              Number(item.tipodocumentoarchivoid) === 0 &&
              (item.tipopersonaid === 0 || !item.tipopersonaid) &&
              !claimedIds.has(item.cadenavalorparametroid)
          );
        }

        if (existente) {
          claimedIds.add(existente.cadenavalorparametroid);
        }

        const payload = {
          cadenavalorparametroid: existente ? existente.cadenavalorparametroid : 0,
          cadenavalorid: Number(cadenaId),
          tipopersonaid: tipoPersonaId,
          tipodocumentoarchivoid: 0,
          tiporelacionsocioid: relId,
          requerimiento: String(value),
          tiposociedad: tipoSociedad,
        };

        if (existente) {
          promises.push(api.put("api/CadenaValorParametrizacion", payload));
        } else {
          promises.push(api.post("api/CadenaValorParametrizacion", payload));
        }
      });
    });

    // Guardar concurrentemente
    await Promise.all(promises);
    return configuracionCompleta;
  },
};

export default requisitosService;

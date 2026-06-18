// Servicio para gestionar la configuración de visibilidad y obligatoriedad (Requisitos)
// de documentos y relaciones por cada cadena de valor.
// NOTA: Temporalmente guarda en localStorage hasta que el endpoint en backend esté finalizado.

const DEFAULT_CONFIG = {
  documentos: {
    estatuto: 1,          // 0 = no mostrar, 1 = mostrar obligatorio, 2 = mostrar opcional
    balance: 1,
    acta: 1,
    poderes: 1,
    certificadoPyme: 1,  // Obligatorio por defecto a pedido del usuario
    cartasDocumento: 2,
    otrosDocumentos: 2,
  },
  relaciones: {
    accionistas: 1,
    representantes: 1,
    agentesBolsa: 2,
    usuarios: 2,
  },
};

export const requisitosService = {
  obtenerRequisitosPorCadenaId: (cadenaId) => {
    if (!cadenaId) return DEFAULT_CONFIG;
    const stored = localStorage.getItem(`config_requisitos_${cadenaId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Asegurar que si falta alguna clave nueva, se utilicen los defaults
        return {
          documentos: { ...DEFAULT_CONFIG.documentos, ...parsed.documentos },
          relaciones: { ...DEFAULT_CONFIG.relaciones, ...parsed.relaciones },
        };
      } catch (e) {
        console.error("Error al parsear los requisitos locales:", e);
      }
    }
    return DEFAULT_CONFIG;
  },

  guardarRequisitos: (cadenaId, configuracion) => {
    if (!cadenaId) return;
    localStorage.setItem(`config_requisitos_${cadenaId}`, JSON.stringify(configuracion));
    return configuracion;
  },
};
export default requisitosService;

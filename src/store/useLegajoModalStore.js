import { create } from "zustand";

// Cuenta modales de legajo abiertos (RepresentanteModal, SocioAccionistaModal,
// BolsaModal, etc.). LegajoUniversalBar lo usa para no disparar la migración
// automática a SGR+ (ni su aviso de éxito) mientras el usuario todavía tiene
// una de estas modales abierta: guardar el último dato requerido (ej. el
// CUIT de un representante) puede refrescar la validación del legajo antes
// de que la modal (o su propia validación de CDA) termine de cerrarse.
export const useLegajoModalStore = create((set) => ({
  modalesAbiertos: 0,
  abrirModalLegajo: () =>
    set((s) => ({ modalesAbiertos: s.modalesAbiertos + 1 })),
  cerrarModalLegajo: () =>
    set((s) => ({ modalesAbiertos: Math.max(0, s.modalesAbiertos - 1) })),
}));

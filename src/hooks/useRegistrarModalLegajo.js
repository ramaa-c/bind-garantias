import { useEffect } from "react";
import { useLegajoModalStore } from "../store/useLegajoModalStore";

// Registra en useLegajoModalStore mientras isOpen sea true. Usar en modales
// de personas del legajo (representantes, accionistas, agentes de bolsa) —
// ver el store para el motivo.
export const useRegistrarModalLegajo = (isOpen) => {
  const abrirModalLegajo = useLegajoModalStore((s) => s.abrirModalLegajo);
  const cerrarModalLegajo = useLegajoModalStore((s) => s.cerrarModalLegajo);

  useEffect(() => {
    if (!isOpen) return;
    abrirModalLegajo();
    return () => cerrarModalLegajo();
  }, [isOpen, abrirModalLegajo, cerrarModalLegajo]);
};

import { createContext, useContext, useMemo } from "react";
import {
  documentosRequeridosDeTercero,
  estadoDocumentacionTercero,
} from "../../../../../../utils/documentacionTerceros";

// Lo provee SociosLegajo: la parametrización de la cadena, los archivos del
// socio y cómo refrescarlos. Las secciones lo usan para sumar al chip
// "Falta:" la documentación pendiente de cada tercero, y las modales de
// terceros (useDocumentosEnModal) para mostrar y cargar esa documentación.
// Fuera del legajo (ej. el alta, Paso4Socios) no hay provider y todo sigue
// como antes.
export const DocumentacionTercerosContext = createContext(null);

const SIN_DOCUMENTACION = { resumenDe: () => null };

export const useDocumentacionTerceros = (tipoRelacionSocioId) => {
  const ctx = useContext(DocumentacionTercerosContext);
  return useMemo(() => {
    if (!ctx || !tipoRelacionSocioId) return SIN_DOCUMENTACION;
    const requeridos = documentosRequeridosDeTercero(ctx.requisitos, tipoRelacionSocioId);
    if (requeridos.length === 0) return SIN_DOCUMENTACION;
    return {
      // null mientras cargan los archivos: no se marca como faltante algo
      // que todavía no se sabe si está.
      resumenDe: (persona) =>
        ctx.cargandoArchivos
          ? null
          : estadoDocumentacionTercero({ requeridos, archivos: ctx.archivos, persona, tituloDe: ctx.tituloDe }),
    };
  }, [ctx, tipoRelacionSocioId]);
};

import { createContext, useContext, useMemo } from "react";
import { useDocumentosPorRelacion } from "../../../../../../hooks/useDocumentosPorRelacion";
import {
  documentosRequeridosDeTercero,
  estadoDocumentacionTercero,
} from "../../../../../../utils/documentacionTerceros";

export const DocumentacionTercerosContext = createContext(null);

const SIN_DOCUMENTACION = { resumenDe: () => null };

export const useDocumentacionTerceros = (tipoRelacionSocioId) => {
  const ctx = useContext(DocumentacionTercerosContext);
  const { configuracion, isLoading } = useDocumentosPorRelacion();
  return useMemo(() => {
    if (!ctx || !tipoRelacionSocioId) return SIN_DOCUMENTACION;
    return {
      resumenDe: (persona) => {
        if (ctx.cargandoArchivos || isLoading) return null;
        const requeridos = documentosRequeridosDeTercero(configuracion, tipoRelacionSocioId);
        if (requeridos.length === 0) return null;
        return estadoDocumentacionTercero({ requeridos, archivos: ctx.archivos, persona, tituloDe: ctx.tituloDe });
      },
    };
  }, [ctx, tipoRelacionSocioId, configuracion, isLoading]);
};

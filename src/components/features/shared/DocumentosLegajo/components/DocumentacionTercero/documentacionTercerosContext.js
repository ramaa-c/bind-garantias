import { createContext, useContext, useMemo } from "react";
import {
  documentosRequeridosDeTercero,
  estadoDocumentacionTercero,
} from "../../../../../../utils/documentacionTerceros";

// Lo provee SociosLegajo: la parametrización de la cadena, los archivos del
// socio y cómo abrir la modal de documentación. Las secciones de terceros
// lo leen con useDocumentacionTerceros para pintar el botón de cada tarjeta.
export const DocumentacionTercerosContext = createContext(null);

const SIN_DOCUMENTACION = { resumenDe: () => null, abrir: () => {} };

export const useDocumentacionTerceros = (tipoRelacionSocioId, etiqueta) => {
  const ctx = useContext(DocumentacionTercerosContext);
  return useMemo(() => {
    if (!ctx || !tipoRelacionSocioId) return SIN_DOCUMENTACION;
    const requeridos = documentosRequeridosDeTercero(ctx.requisitos, tipoRelacionSocioId);
    if (requeridos.length === 0) return SIN_DOCUMENTACION;
    return {
      // null mientras cargan los archivos: el botón no muestra un "0 de N"
      // que todavía no es cierto.
      resumenDe: (persona) =>
        ctx.cargandoArchivos
          ? null
          : estadoDocumentacionTercero({ requeridos, archivos: ctx.archivos, persona, tituloDe: ctx.tituloDe }),
      abrir: (persona) => ctx.abrir({ persona, tipoRelacionSocioId, etiqueta }),
    };
  }, [ctx, tipoRelacionSocioId, etiqueta]);
};

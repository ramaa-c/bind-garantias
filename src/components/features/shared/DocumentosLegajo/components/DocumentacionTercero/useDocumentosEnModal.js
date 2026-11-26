import { useContext, useEffect, useMemo, useState } from "react";
import { DocumentacionTercerosContext } from "./documentacionTercerosContext";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import {
  REQUERIMIENTO_OBLIGATORIO,
  archivoDeTercero,
  descripcionArchivoTercero,
  documentosRequeridosDeTercero,
  esDocumentoDni,
  estadoDocumentacionTercero,
} from "../../../../../../utils/documentacionTerceros";

export const MODO_SIN_DOCUMENTOS = "ninguno";
export const MODO_SOLO_DNI = "soloDni";
export const MODO_PESTANAS = "pestanas";

/**
 * Documentación de un tercero dentro de su modal de alta/edición.
 *
 * - modo "ninguno": el tipo de tercero no tiene documentación configurada.
 * - modo "soloDni": solo DNI frente/dorso - va como una sección más al
 *   final del formulario, como en Accionistas.
 * - modo "pestanas": DNI y/o otros documentos - la modal suma las pestañas
 *   Datos | Documentación en la cabecera.
 *
 * Los archivos elegidos quedan en memoria (`locales`) y se suben recién al
 * guardar, junto con los datos (subirPendientes): un solo botón para todo.
 */
export const useDocumentosEnModal = ({ tipoRelacionSocioId, persona, isOpen }) => {
  const ctx = useContext(DocumentacionTercerosContext);
  const [locales, setLocales] = useState({});
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setLocales({});
  }

  const requeridos = useMemo(
    () => (ctx ? documentosRequeridosDeTercero(ctx.requisitos, tipoRelacionSocioId) : []),
    [ctx, tipoRelacionSocioId],
  );
  const modo =
    requeridos.length === 0
      ? MODO_SIN_DOCUMENTOS
      : requeridos.every((r) => esDocumentoDni(r.tipoDocumentoId))
        ? MODO_SOLO_DNI
        : MODO_PESTANAS;

  const cuit = persona?.cuit;
  const nombre = persona?.nombre;
  const items = useMemo(() => {
    if (requeridos.length === 0) return [];
    const { items: base } = estadoDocumentacionTercero({
      requeridos,
      archivos: ctx?.archivos,
      persona: { cuit, nombre },
      tituloDe: ctx?.tituloDe,
    });
    return base.map((item) => ({ ...item, local: locales[item.clave] || null }));
  }, [requeridos, ctx, cuit, nombre, locales]);

  const faltantes = items
    .filter((i) => i.requerimiento === REQUERIMIENTO_OBLIGATORIO && !i.archivo && !i.local)
    .map((i) => i.titulo);
  const cargados = items.filter((i) => i.archivo || i.local).length;

  const elegir = (clave, archivo) => setLocales((prev) => ({ ...prev, [clave]: archivo }));

  // Sube lo elegido en esta sesión de la modal. Se busca el archivo vigente
  // contra el backend (no contra lo que había al abrir) para reemplazarlo
  // en vez de duplicarlo.
  const subirPendientes = async ({ socioIdActivo, persona: personaFinal, excluir = [] }) => {
    const pendientes = Object.entries(locales).filter(([clave, f]) => f instanceof File && !excluir.includes(clave));
    if (!socioIdActivo || pendientes.length === 0) return;
    const existentes = await socioArchivoService.obtenerArchivos(socioIdActivo, true);
    for (const [clave, archivo] of pendientes) {
      const item = items.find((i) => i.clave === clave);
      if (!item) continue;
      const descripcion = descripcionArchivoTercero({
        clave,
        titulo: item.titulo,
        cuit: personaFinal.cuit,
        nombre: personaFinal.nombre,
      });
      const existente = archivoDeTercero(existentes, item.tipoDocumentoId, personaFinal);
      if (existente) {
        await socioArchivoService.actualizarArchivo(existente, archivo, clave, descripcion);
      } else {
        await socioArchivoService.subirArchivo(socioIdActivo, archivo, clave, descripcion);
      }
    }
    setLocales({});
    await ctx?.refrescar?.();
  };

  return {
    modo,
    items,
    faltantes,
    cargados,
    total: items.length,
    hayCambios: Object.values(locales).some((f) => f instanceof File),
    elegir,
    subirPendientes,
  };
};

/**
 * Abierta desde el botón "Documentación" de la tarjeta con solo DNI (que va
 * dentro del formulario, sin pestañas): baja hasta esa sección. Se espera a
 * que el formulario esté montado (la edición puede tardar un instante).
 */
export const useIrASeccionDocumentos = ({ isOpen, pestanaInicial, modo, idSeccion }) => {
  useEffect(() => {
    if (!isOpen || pestanaInicial !== "documentacion" || modo !== MODO_SOLO_DNI) return undefined;
    let intentos = 0;
    const timer = setInterval(() => {
      const seccion = document.getElementById(idSeccion);
      intentos += 1;
      if (seccion) {
        seccion.scrollIntoView({ behavior: "smooth", block: "center" });
        clearInterval(timer);
      } else if (intentos > 20) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isOpen, pestanaInicial, modo, idSeccion]);
};

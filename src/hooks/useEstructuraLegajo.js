import { useMemo } from "react";
import { useTituloDocumento } from "./useTipoDocumentoArchivo";
import { ESTRUCTURA_LEGAJO } from "../components/features/shared/DocumentosLegajo/DocumentosLegajo.constants";

export const useEstructuraLegajo = () => {
  const tituloDe = useTituloDocumento();
  return useMemo(
    () => ESTRUCTURA_LEGAJO.map((doc) => ({ ...doc, title: tituloDe(doc.key) })),
    [tituloDe],
  );
};

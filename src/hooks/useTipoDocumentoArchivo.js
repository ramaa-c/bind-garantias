import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoDocumentoArchivoService } from "../services/tipoDocumentoArchivoService";
import { useTipoDocumentoArchivo } from "./useCatalogos";
import {
  TIPOS_DOCUMENTO_ARCHIVO,
  IDS_DOCUMENTO_SIEMPRE_ACTIVOS,
} from "../constants/tiposDocumentoArchivo";

const QUERY_KEY = ["tipoDocumentoArchivo", "activos"];

export const useTiposDocumentoArchivoActivos = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: tipoDocumentoArchivoService.obtenerActivos,
    staleTime: 1000 * 60 * 5,
  });

export const useDocumentMetadata = () => {
  const { data: activos, isLoading, isError } = useTiposDocumentoArchivoActivos();
  const { data: descripcionSgr } = useTipoDocumentoArchivo();

  return useMemo(() => {
    const lista = Array.isArray(activos) ? activos : activos?.list;
    const disponible = !isError && Array.isArray(lista);

    const descripcionWeb = new Map();
    if (disponible) {
      lista.forEach((item) => {
        const id = Number(item?.tipodocumentoarchivoid);
        if (id) descripcionWeb.set(id, String(item.descripcion || "").trim());
      });
    }

    const idsHabilitados = disponible
      ? new Set([...descripcionWeb.keys(), ...IDS_DOCUMENTO_SIEMPRE_ACTIVOS])
      : null;

    const idDe = (clave) => Number(TIPOS_DOCUMENTO_ARCHIVO[clave]);

    return {
      idsHabilitados,
      estaHabilitado: (clave) => !idsHabilitados || idsHabilitados.has(idDe(clave)),
      tituloDe: (clave) =>
        descripcionWeb.get(idDe(clave)) || descripcionSgr?.get(idDe(clave)) || "",
      isLoading,
    };
  }, [activos, isError, isLoading, descripcionSgr]);
};

export const useTituloDocumento = () => useDocumentMetadata().tituloDe;

export const useCrearTipoDocumentoArchivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tipoDocumentoArchivoService.crear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useActualizarTipoDocumentoArchivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tipoDocumentoArchivoService.actualizar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

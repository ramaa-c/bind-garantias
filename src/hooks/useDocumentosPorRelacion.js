import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoRelacionSocioTipoDocumentoService } from "../services/tipoRelacionSocioTipoDocumentoService";
import { armarConfiguracionDocumentos, CONFIGURACION_DOCUMENTOS_POR_DEFECTO } from "../utils/documentacionTerceros";

const QUERY_KEY = ["tipoRelacionSocioTipoDocumento"];

export const useDocumentosPorRelacion = () => {
  const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => tipoRelacionSocioTipoDocumentoService.listar(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const configuracion = useMemo(
    () => (isSuccess ? armarConfiguracionDocumentos(data) : CONFIGURACION_DOCUMENTOS_POR_DEFECTO),
    [data, isSuccess],
  );

  return { configuracion, isLoading, isError };
};

export const useGuardarDocumentosDeRelacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tipoRelacionSocioId, valores }) =>
      tipoRelacionSocioTipoDocumentoService.guardarDeRelacion(tipoRelacionSocioId, valores),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

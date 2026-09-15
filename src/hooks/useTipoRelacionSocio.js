import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoRelacionSocioService } from "../services/tipoRelacionSocioService";
import {
  normalizarCatalogoActivo,
  construirRelationMetadata,
} from "../utils/relacionesTercerosUtils";

const QUERY_KEY = ["tipoRelacionSocio", "activos"];

// Lista curada (api/TipoRelacionSocio): los tipos de relación que el admin
// ya activó para la web, con su Descripcion propia. Es la fuente que
// reemplaza al TIPO_RELACION_MAP hardcodeado en requisitosService.js.
export const useTiposRelacionSocioActivos = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: tipoRelacionSocioService.obtenerActivos,
  });

// Metadata de relaciones (título/descripción por clave) lista para pintar -
// combina el catálogo curado con los 4 tipos "de siempre" + extras. Única
// fuente para RequisitosConfigModal y la mini parametrización de terceros
// en TiposRelacionSocio.jsx, para no mantener la misma lógica en dos
// lugares (ver construirRelationMetadata en utils/relacionesTercerosUtils).
export const useRelationMetadata = () => {
  const { data: catalogoActivosData, isLoading: isLoadingCatalogoActivo } =
    useTiposRelacionSocioActivos();

  const catalogoActivo = useMemo(
    () => normalizarCatalogoActivo(catalogoActivosData),
    [catalogoActivosData],
  );

  const relationMetadata = useMemo(
    () => construirRelationMetadata(catalogoActivo, isLoadingCatalogoActivo),
    [catalogoActivo, isLoadingCatalogoActivo],
  );

  return { relationMetadata, isLoading: isLoadingCatalogoActivo };
};

export const useCrearTipoRelacionSocio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tipoRelacionSocioService.crear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useActualizarTipoRelacionSocio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tipoRelacionSocioService.actualizar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

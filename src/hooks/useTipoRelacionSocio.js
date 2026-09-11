import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoRelacionSocioService } from "../services/tipoRelacionSocioService";

const QUERY_KEY = ["tipoRelacionSocio", "activos"];

// Lista curada (api/TipoRelacionSocio): los tipos de relación que el admin
// ya activó para la web, con su Descripcion propia. Es la fuente que
// reemplaza al TIPO_RELACION_MAP hardcodeado en requisitosService.js.
export const useTiposRelacionSocioActivos = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: tipoRelacionSocioService.obtenerActivos,
  });

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

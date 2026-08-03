import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { terminosService } from "../services/terminosService";

export const useObtenerTerminosVigentes = (options = {}) => {
  return useQuery({
    queryKey: ["terminos", "vigente"],
    queryFn: terminosService.obtenerTerminosVigentes,
    ...options,
  });
};

export const usePublicarTerminos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminosService.publicarTerminos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminos", "vigente"] });
    },
  });
};

export const useObtenerConfirmacionTyC = (usuarioId, options = {}) => {
  const { enabled = true, ...rest } = options;
  return useQuery({
    queryKey: ["terminos", "confirmacion", usuarioId],
    queryFn: () => terminosService.obtenerConfirmacionTyC(usuarioId),
    enabled: !!usuarioId && enabled,
    ...rest,
  });
};

export const useConfirmarTyC = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminosService.confirmarTyC,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["terminos", "confirmacion", variables.usuarioWebId],
      });
    },
  });
};

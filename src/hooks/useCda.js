import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cdaService } from "../services/cdaService";

export const useObtenerCda = (cdaId, options = {}) => {
  return useQuery({
    queryKey: ["cda", "detalle", cdaId],
    queryFn: () => cdaService.obtenerCda(cdaId),
    enabled: !!cdaId,
    ...options,
  });
};

export const useEjecutarCda = () => {
  return useMutation({
    mutationFn: (data) => cdaService.ejecutarCda(data),
  });
};

export const useCrearCda = () => {
  return useMutation({
    mutationFn: (cdaData) => cdaService.crearCda(cdaData),
  });
};

export const useActualizarCda = () => {
  return useMutation({
    mutationFn: (cdaData) => cdaService.actualizarCda(cdaData),
  });
};

export const useActualizarGrupoCda = () => {
  return useMutation({
    mutationFn: (grupoData) => cdaService.actualizarGrupoCda(grupoData),
  });
};

export const useObtenerTodosCdas = (options = {}) => {
  return useQuery({
    queryKey: ["cda", "todos_list"],
    queryFn: () => cdaService.obtenerTodosCdas(),
    ...options,
  });
};

export const useProbarCda = () => {
  return useMutation({
    mutationFn: ({ cuit, expresion, expresionLog }) => cdaService.probarCda(cuit, expresion, expresionLog),
  });
};

export const useReejecutarCda = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => cdaService.reejecutarCda(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socios", "executeCda"] });
    },
  });
};

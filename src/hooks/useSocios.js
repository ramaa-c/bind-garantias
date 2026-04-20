import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sociosService } from "../services/sociosService";

export const useSocios = (filtros = {}) => {
  return useQuery({
    queryKey: ["socios", "lista", filtros],
    queryFn: () => sociosService.obtenerSocios(filtros),
    staleTime: 1000 * 60,
  });
};

export const useSocioPorId = (socioId) => {
  return useQuery({
    queryKey: ["socios", "detalle", socioId],
    queryFn: () => sociosService.obtenerSocioPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCrearSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.crearSocio,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["socios", "lista"] });
    },
    onError: (error) => {
      console.error("Error al crear el socio:", error);
    },
  });
};

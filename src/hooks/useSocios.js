import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { sociosService } from '../services/sociosService';

export const useObtenerSocios = (params = {}) => {
    return useQuery({
        queryKey: ['socios', 'lista', params],
        queryFn: () => sociosService.obtenerSocios(params),
        staleTime: 1000 * 60 * 2, // 2 minutos para el listado
        placeholderData: keepPreviousData,
    });
};

export const useSocios = useObtenerSocios; // Alias para compatibilidad con PantallaGestionSocios

export const useSocioPorId = (socioId) => {
  return useQuery({
    queryKey: ["socios", "detalle", socioId],
    queryFn: () => sociosService.obtenerSocioPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: keepPreviousData,
  });
};

export const useCrearSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.crearSocio,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["socios", "lista"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error al crear el socio:", error);
    },
  });
};

export const useActualizarSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.actualizarSocio,
    onSuccess: (data, variables) => {
      return Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: ["socios", "lista"] }),
          variables.socioid &&
            queryClient
              .invalidateQueries({
                queryKey: ["socios", "detalle", variables.socioid],
              })
              .catch(() => {}),
        ].filter(Boolean),
      );
    },
    onError: (error) => {
      console.error("Error al actualizar el socio:", error);
    },
  });
};

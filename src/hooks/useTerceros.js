import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { tercerosService } from '../services/tercerosService';

export const useObtenerTerceros = (params = {}) => {
    return useQuery({
        queryKey: ['terceros', 'lista', params],
        queryFn: () => tercerosService.obtenerTerceros(params),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData
    });
};

export const useObtenerTerceroPorId = (terceroId) => {
    return useQuery({
        queryKey: ['terceros', 'detalle', terceroId],
        queryFn: () => tercerosService.obtenerTerceroPorId(terceroId),
        enabled: !!terceroId,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

export const useCrearTercero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.crearTercero,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["terceros", "lista"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error al crear el tercero:", error);
    },
  });
};

export const useObtenerTiposHabilitados = (terceroId) => {
    return useQuery({
        queryKey: ['terceros', 'tiposHabilitados', terceroId],
        queryFn: () => tercerosService.obtenerTiposHabilitados(terceroId),
        enabled: !!terceroId
    });
};

export const useRelacionesSocio = (socioId) => {
    return useQuery({
        queryKey: ['socioTerceroRelacion', socioId],
        queryFn: () => tercerosService.obtenerRelacionesDeSocio(socioId),
        enabled: !!socioId
    });
};
export const useGuardarRelacionesSocio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: tercerosService.guardarRelacionesDeSocio,
        onSuccess: (data, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["relacionesSocio", variables.socioid],
                }),
            ]);
        },
        onError: (error) => {
            console.error("Error al guardar las relaciones del socio:", error);
        },
    });
};

export const useBuscarTerceroPorCuit = () => {
  return useMutation({
    mutationFn: (cuit) => tercerosService.obtenerTerceros({ Cuit: cuit }),
  });
};

export const useActualizarTercero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.actualizarTercero,
    onSuccess: (data, variables) => {
      return Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: ["terceros", "lista"] }),
          variables.tercerorelacionadoid &&
            queryClient
              .invalidateQueries({
                queryKey: [
                  "terceros",
                  "detalle",
                  variables.tercerorelacionadoid,
                ],
              })
              .catch(() => {}),
        ].filter(Boolean),
      );
    },
    onError: (error) => {
      console.error("Error al actualizar el tercero:", error);
    },
  });
};

export const useActualizarRelacionSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.actualizarRelacionDeSocio,
    onSuccess: (data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["relacionesSocio", variables.socioid],
        }),
      ]);
    },
    onError: (error) => {
      console.error("Error al actualizar la relación del socio:", error);
    },
  });
};

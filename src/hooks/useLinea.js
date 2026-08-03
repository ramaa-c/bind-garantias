import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { lineaService } from '../services/lineaService';

export const useObtenerCambiosEstadoLinea = (lineaId) => {
    return useQuery({
        queryKey: ['linea', 'cambiosEstado', lineaId],
        queryFn: () => lineaService.obtenerCambiosEstado(lineaId),
        enabled: !!lineaId,
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData
    });
};

export const useObtenerLimitesPorSocio = (socioId) => {
    return useQuery({
        queryKey: ['linea', 'limitesPorSocio', socioId],
        queryFn: () => lineaService.obtenerLimitesPorSocio(socioId),
        enabled: !!socioId
    });
};

export const useObtenerLimitesCadenaValor = (cadenavalorid) => {
    return useQuery({
        queryKey: ['linea', 'limitesCadenaValor', String(cadenavalorid)],
        queryFn: () => lineaService.obtenerLimitesCadenaValor(cadenavalorid),
        enabled: !!cadenavalorid,
    });
};

export const useCrearLimiteCadenaValor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.crearLimiteCadenaValor,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'limitesCadenaValor', String(variables.cadenavalorid)] });
        }
    });
};

export const useActualizarLimiteCadenaValor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.actualizarLimiteCadenaValor,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'limitesCadenaValor', String(variables.cadenavalorid)] });
        }
    });
};



export const useObtenerProductosPorLimite = (tipolimiteid) => {
    return useQuery({
        queryKey: ['linea', 'productosPorLimite', String(tipolimiteid)],
        queryFn: () => lineaService.obtenerProductosPorLimite(tipolimiteid),
        enabled: tipolimiteid !== undefined && tipolimiteid !== null,
    });
};

export const useAsociarProductoLimite = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.asociarProductoLimite,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'productosPorLimite', String(variables.tipolimiteid)] });
        }
    });
};

export const useActualizarProductoLimite = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.actualizarProductoLimite,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'productosPorLimite', String(variables.tipolimiteid)] });
        }
    });
};

export const useDesasociarProductoLimite = (tipolimiteid) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.desasociarProductoLimite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'productosPorLimite', String(tipolimiteid)] });
        }
    });
};


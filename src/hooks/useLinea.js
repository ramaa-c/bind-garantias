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

export const useObtenerLimites = (cadenavalorid) => {
    return useQuery({
        queryKey: ['linea', 'limites', cadenavalorid ? String(cadenavalorid) : 'todas'],
        queryFn: () => lineaService.obtenerLimites(cadenavalorid),
    });
};

export const useActualizarLimiteSocio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.actualizarLimiteSocio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'limites'] });
            // useObtenerLimitesSocio (pantalla de Solicitudes del cliente) usa
            // una queryKey distinta ('limites','socio',socioId) para el mismo
            // recurso - sin esto, cancelar/aprobar/rechazar desde un lugar no
            // refresca la lista del otro.
            queryClient.invalidateQueries({ queryKey: ['limites', 'socio'] });
        }
    });
};

export const useMigrarLinea = () => {
    return useMutation({
        mutationFn: lineaService.migrarLinea,
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
        // Invalida por prefijo (sin el ID de cadena al final) en vez de
        // reconstruir la queryKey exacta con String(variables.cadenavalorid):
        // si ese ID viajó en un tipo/formato distinto al que ya está en la
        // cache (ej. number vs string, o con decimales de más si el backend
        // lo serializó como float), la key exacta no matchea y la card queda
        // desactualizada hasta recargar la página. Con el prefijo alcanza,
        // porque esta pantalla solo tiene una cadena seleccionada a la vez.
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'limitesCadenaValor'] });
        }
    });
};

export const useActualizarLimiteCadenaValor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: lineaService.actualizarLimiteCadenaValor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['linea', 'limitesCadenaValor'] });
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


import { useQuery, keepPreviousData } from '@tanstack/react-query';
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


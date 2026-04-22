import { useQuery } from '@tanstack/react-query';
import { lineaService } from '../services/lineaService';

export const useObtenerCambiosEstadoLinea = (lineaId) => {
    return useQuery({
        queryKey: ['linea', 'cambiosEstado', lineaId],
        queryFn: () => lineaService.obtenerCambiosEstado(lineaId),
        enabled: !!lineaId
    });
};

export const useObtenerLimitesPorSocio = (socioId) => {
    return useQuery({
        queryKey: ['linea', 'limitesPorSocio', socioId],
        queryFn: () => lineaService.obtenerLimitesPorSocio(socioId),
        enabled: !!socioId
    });
};


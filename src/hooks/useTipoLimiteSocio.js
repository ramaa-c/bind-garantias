import { useQuery } from '@tanstack/react-query';
import { tipoLimiteSocioService } from '../services/tipoLimiteSocioService';

export const useObtenerCambiosEstado = (tipoLimiteSocioId) => {
    return useQuery({
        queryKey: ['tipoLimiteSocio', 'cambiosEstado', tipoLimiteSocioId],
        queryFn: () => tipoLimiteSocioService.obtenerCambiosEstado(tipoLimiteSocioId),
        enabled: !!tipoLimiteSocioId
    });
};

export const useObtenerLimitesPorSocio = (socioId) => {
    return useQuery({
        queryKey: ['tipoLimiteSocio', 'limitesPorSocio', socioId],
        queryFn: () => tipoLimiteSocioService.obtenerLimitesPorSocio(socioId),
        enabled: !!socioId
    });
};

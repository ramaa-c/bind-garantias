import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { posicionConsolidadaService } from '../services/posicionConsolidadaService';

export const useObtenerContragarantiaSocio = (socioId) => {
    return useQuery({
        queryKey: ['posicionConsolidada', 'contragarantia', socioId],
        queryFn: () => posicionConsolidadaService.obtenerContragarantiaSocio(socioId),
        enabled: !!socioId,
        staleTime: 1000 * 60 * 2, // 2 minutos
        placeholderData: keepPreviousData,
    });
};

export const useObtenerLimiteSocio = (socioId) => {
    return useQuery({
        queryKey: ['posicionConsolidada', 'limite', socioId],
        queryFn: () => posicionConsolidadaService.obtenerLimiteSocio(socioId),
        enabled: !!socioId,
        staleTime: 1000 * 60 * 2, // 2 minutos
        placeholderData: keepPreviousData,
    });
};

export const useObtenerLimiteSocioPorCuit = (cuit) => {
    const cuitLimpio = String(cuit || '').replace(/\D/g, '');
    return useQuery({
        queryKey: ['posicionConsolidada', 'limitePorCuit', cuitLimpio],
        queryFn: () => posicionConsolidadaService.obtenerLimiteSocioPorCuit(cuitLimpio),
        enabled: !!cuitLimpio,
        staleTime: 1000 * 60 * 2, // 2 minutos
        placeholderData: keepPreviousData,
    });
};

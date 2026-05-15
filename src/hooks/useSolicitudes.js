import { useQuery } from '@tanstack/react-query';
import { solicitudesService } from '../services/solicitudesService';
import { lineaService } from '../services/lineaService';

export const useObtenerSolicitudesEnProceso = (cuit) => {
    return useQuery({
        queryKey: ['solicitudes', 'en-proceso', cuit],
        queryFn: () => solicitudesService.obtenerSolicitudesEnProceso(cuit),
        enabled: !!cuit,
        staleTime: 1000 * 60 * 5,
    });
};

export const useObtenerLimitesSocio = (socioId) => {
    return useQuery({
        queryKey: ['limites', 'socio', socioId],
        queryFn: () => lineaService.obtenerLimitesPorSocio(socioId),
        enabled: !!socioId,
        staleTime: 1000 * 60 * 5,
    });
};

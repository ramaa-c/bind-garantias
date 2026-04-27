import { useQuery } from '@tanstack/react-query';
import { solicitudesService } from '../services/solicitudesService';

export const useObtenerSolicitudesEnProceso = (cuit) => {
    return useQuery({
        queryKey: ['solicitudes', 'en-proceso', cuit],
        queryFn: () => solicitudesService.obtenerSolicitudesEnProceso(cuit),
        enabled: !!cuit,
        staleTime: 1000 * 60 * 5,
    });
};

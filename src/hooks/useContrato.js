import { useQuery } from '@tanstack/react-query';
import { contratoService } from '../services/contratoService';

export const useObtenerEstadosContrato = () => {
    return useQuery({
        queryKey: ['contratos', 'estados'],
        queryFn: () => contratoService.obtenerEstadosContrato()
    });
};

export const useObtenerContratosPorSocio = (socioId) => {
    return useQuery({
        queryKey: ['contratos', 'porSocio', socioId],
        queryFn: () => contratoService.obtenerContratosPorSocio(socioId),
        enabled: !!socioId
    });
};

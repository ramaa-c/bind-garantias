import { useQuery, useMutation } from '@tanstack/react-query';
import { sociosService } from '../services/sociosService';

export const useObtenerSocios = (params = {}) => {
    return useQuery({
        queryKey: ['socios', params],
        queryFn: () => sociosService.obtenerSocios(params)
    });
};

export const useObtenerSocioPorId = (socioId) => {
    return useQuery({
        queryKey: ['socios', socioId],
        queryFn: () => sociosService.obtenerSocioPorId(socioId),
        enabled: !!socioId
    });
};

export const useCrearSocio = () => {
    return useMutation({
        mutationFn: (socioData) => sociosService.crearSocio(socioData)
    });
};

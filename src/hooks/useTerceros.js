import { useQuery, useMutation } from '@tanstack/react-query';
import { tercerosService } from '../services/tercerosService';

export const useObtenerTerceros = (params = {}) => {
    return useQuery({
        queryKey: ['terceros', params],
        queryFn: () => tercerosService.obtenerTerceros(params)
    });
};

export const useObtenerTerceroPorId = (terceroId) => {
    return useQuery({
        queryKey: ['terceros', terceroId],
        queryFn: () => tercerosService.obtenerTerceroPorId(terceroId),
        enabled: !!terceroId
    });
};

export const useCrearTercero = () => {
    return useMutation({
        mutationFn: (terceroData) => tercerosService.crearTercero(terceroData)
    });
};

export const useObtenerTiposHabilitados = (terceroId) => {
    return useQuery({
        queryKey: ['terceros', 'tiposHabilitados', terceroId],
        queryFn: () => tercerosService.obtenerTiposHabilitados(terceroId),
        enabled: !!terceroId
    });
};

export const useObtenerRelacionesDeSocio = (socioId) => {
    return useQuery({
        queryKey: ['socioTerceroRelacion', socioId],
        queryFn: () => tercerosService.obtenerRelacionesDeSocio(socioId),
        enabled: !!socioId
    });
};

export const useGuardarRelacionesDeSocio = () => {
    return useMutation({
        mutationFn: (relacionData) => tercerosService.guardarRelacionesDeSocio(relacionData)
    });
};

import { useQuery } from '@tanstack/react-query';
import { cadenaValorService } from '../services/cadenaValorService';

export const useObtenerTodas = () => {
    return useQuery({
        queryKey: ['cadenaValor', 'todas'],
        queryFn: () => cadenaValorService.obtenerTodas()
    });
};

export const useObtenerTodasPorPlataforma = (cursaPlataforma) => {
    return useQuery({
        queryKey: ['cadenaValor', 'plataforma', cursaPlataforma],
        queryFn: () => cadenaValorService.obtenerTodasPorPlataforma(cursaPlataforma),
        enabled: !!cursaPlataforma
    });
};

export const useObtenerPorId = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerPorId(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

export const useObtenerLibradores = (cadenaValorId, page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['cadenaValor', 'libradores', cadenaValorId, page, pageSize],
        queryFn: () => cadenaValorService.obtenerLibradores(cadenaValorId, page, pageSize),
        enabled: !!cadenaValorId
    });
};

export const useObtenerLibradorPorCuit = (cadenaValorId, cuitLibrador) => {
    return useQuery({
        queryKey: ['cadenaValor', 'libradorCuit', cadenaValorId, cuitLibrador],
        queryFn: () => cadenaValorService.obtenerLibradorPorCuit(cadenaValorId, cuitLibrador),
        enabled: !!cadenaValorId && !!cuitLibrador
    });
};

export const useObtenerLineas = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'lineas', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerLineas(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

export const useVerificarAutorizacionEmail = (cadenaValorId, email) => {
    return useQuery({
        queryKey: ['cadenaValor', 'autorizacion', cadenaValorId, email],
        queryFn: () => cadenaValorService.verificarAutorizacionEmail(cadenaValorId, email),
        enabled: !!cadenaValorId && !!email,
        retry: false
    });
};

export const useObtenerCadenasPorEmail = (email) => {
    return useQuery({
        queryKey: ['cadenaValor', 'porEmail', email],
        queryFn: () => cadenaValorService.obtenerCadenasPorEmail(email),
        enabled: !!email
    });
};

export const useObtenerRelaciones = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'relaciones', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerRelaciones(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

export const useObtenerUtilizado = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'utilizado', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerUtilizado(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

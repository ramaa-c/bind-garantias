import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { cadenaValorService } from '../services/cadenaValorService';

export const useObtenerTodas = (page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['cadenaValor', 'todas', page, pageSize],
        queryFn: () => cadenaValorService.obtenerTodas(page, pageSize),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

export const useObtenerTodasPorPlataforma = (cursaPlataforma, page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['cadenaValor', 'plataforma', cursaPlataforma, page, pageSize],
        queryFn: () => cadenaValorService.obtenerTodasPorPlataforma(cursaPlataforma, page, pageSize),
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
        enabled: !!cadenaValorId,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

export const useObtenerLibradorPorCuit = (cadenaValorId, cuitLibrador) => {
    return useQuery({
        queryKey: ['cadenaValor', 'libradorCuit', cadenaValorId, cuitLibrador],
        queryFn: () => cadenaValorService.obtenerLibradorPorCuit(cadenaValorId, cuitLibrador),
        enabled: !!cadenaValorId && !!cuitLibrador
    });
};

export const useObtenerLineas = (cadenaValorId, page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['cadenaValor', 'lineas', cadenaValorId, page, pageSize],
        queryFn: () => cadenaValorService.obtenerLineas(cadenaValorId, page, pageSize),
        enabled: !!cadenaValorId,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
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

export const useObtenerPorCadenaValorIdWeb = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'web', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerPorCadenaValorIdWeb(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

export const useObtenerCdasPorCadenaId = (cadenaId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'cdas', cadenaId],
        queryFn: () => cadenaValorService.obtenerCdasPorCadenaId(cadenaId),
        enabled: !!cadenaId
    });
};

export const useCrearCadenaValor = () => {
    return useMutation({
        mutationFn: cadenaValorService.crearCadenaValor
    });
};

export const useActualizarCadenaValor = () => {
    return useMutation({
        mutationFn: cadenaValorService.actualizarCadenaValor
    });
};

export const useObtenerTodasWeb = () => {
    return useQuery({
        queryKey: ['cadenaValor', 'web', 'todas_list'],
        queryFn: () => cadenaValorService.obtenerTodasWeb(),
    });
};

import { useQuery, useMutation } from '@tanstack/react-query';
import { usuarioService } from '../services/usuarioService';

export const useLogin = () => {
    return useMutation({
        mutationFn: (credenciales) => usuarioService.login(credenciales)
    });
};

export const useBloquearUsuario = () => {
    return useMutation({
        mutationFn: (usuarioId) => usuarioService.bloquearUsuario(usuarioId)
    });
};

export const useReactivarUsuario = () => {
    return useMutation({
        mutationFn: (usuarioId) => usuarioService.reactivarUsuario(usuarioId)
    });
};

export const useResetearPassword = () => {
    return useMutation({
        mutationFn: (usuarioIdentificador) => usuarioService.resetearPassword(usuarioIdentificador)
    });
};

export const useCrearUsuario = () => {
    return useMutation({
        mutationFn: (nuevoUsuario) => usuarioService.crearUsuario(nuevoUsuario)
    });
};

export const useCambiarPassword = () => {
    return useMutation({
        mutationFn: (datosCambioClave) => usuarioService.cambiarPassword(datosCambioClave)
    });
};

export const useObtenerPorNombreOEmail = (identificador) => {
    return useQuery({
        queryKey: ['usuarios', 'porNombreOEmail', identificador],
        queryFn: () => usuarioService.obtenerPorNombreOEmail(identificador),
        enabled: !!identificador
    });
};

export const useBuscarUsuarios = (page = 1, pageSize = 10, email = "", nombre = "") => {
    return useQuery({
        queryKey: ['usuarios', 'busqueda', page, pageSize, email, nombre],
        queryFn: () => usuarioService.buscarUsuarios(page, pageSize, email, nombre)
    });
};

export const useObtenerUsuarioPorId = (usuarioId) => {
    return useQuery({
        queryKey: ['usuarios', 'detalle', usuarioId],
        queryFn: () => usuarioService.obtenerUsuarioPorId(usuarioId),
        enabled: !!usuarioId
    });
};

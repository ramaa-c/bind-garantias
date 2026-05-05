import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { usuarioService } from "../services/usuarioService";

export const useLogin = () => {
  return useMutation({
    mutationFn: (credenciales) => usuarioService.login(credenciales),
  });
};

export const useBloquearUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId) => usuarioService.bloquearUsuario(usuarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "busqueda"] });
    },
  });
};

export const useReactivarUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId) => usuarioService.reactivarUsuario(usuarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "busqueda"] });
    },
  });
};

export const useResetearPassword = () => {
  return useMutation({
    mutationFn: (payload) => usuarioService.resetearPassword(payload),
  });
};

export const useCrearUsuario = () => {
  return useMutation({
    mutationFn: (nuevoUsuario) => usuarioService.crearUsuario(nuevoUsuario),
  });
};

export const useCambiarPassword = () => {
  return useMutation({
    mutationFn: (datosCambioClave) =>
      usuarioService.cambiarPassword(datosCambioClave),
  });
};

export const useObtenerUsuarioPorEncrypt = (encryptToken) => {
  return useQuery({
    queryKey: ["usuarios", "detalleEncrypt", encryptToken],
    queryFn: () => usuarioService.obtenerPorEncrypt(encryptToken),
    enabled: !!encryptToken && encryptToken.length > 10,
    retry: false,
  });
};

export const useEstablecerClave = () => {
  return useMutation({
    mutationFn: ({ usuarioid, data }) =>
      usuarioService.establecerClaveNueva({ usuarioid, data }),
  });
};

export const useObtenerPorNombreOEmail = (identificador) => {
  return useQuery({
    queryKey: ["usuarios", "porNombreOEmail", identificador],
    queryFn: () => usuarioService.obtenerPorNombreOEmail(identificador),
    enabled: !!identificador,
  });
};

export const useBuscarUsuarios = (
  page = 1,
  pageSize = 10,
  email = "",
  nombre = "",
) => {
  return useQuery({
    queryKey: ["usuarios", "busqueda", page, pageSize, email, nombre],
    queryFn: () => usuarioService.buscarUsuarios(page, pageSize, email, nombre),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

export const useObtenerUsuarioPorId = (usuarioId) => {
  return useQuery({
    queryKey: ["usuarios", "detalle", usuarioId],
    queryFn: () => usuarioService.obtenerUsuarioPorId(usuarioId),
    enabled: !!usuarioId,
  });
};

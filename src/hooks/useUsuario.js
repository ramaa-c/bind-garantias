import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { usuarioService } from "../services/usuarioService";
import { useAuthStore } from "../store/useAuthStore";

export const useLogin = () => {
  return useMutation({
    mutationFn: (credenciales) => usuarioService.login(credenciales),
  });
};

export const useLoginByCode = () => {
  return useMutation({
    mutationFn: (credenciales) => usuarioService.loginByCode(credenciales),
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
    mutationFn: ({ usuarioid, data }) =>
      usuarioService.cambiarPassword(usuarioid, data),
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

// UsuarioWebID del usuario logueado (admin o cliente): varios endpoints de
// escritura ahora lo piden para dejar registrado quién hizo el cambio.
export const useUsuarioWebIdActual = () => {
  const user = useAuthStore((state) => state.user);
  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email || "");
  const registro = Array.isArray(usuarioDb)
    ? usuarioDb[0]
    : usuarioDb?.items?.[0] || usuarioDb?.data?.[0] || usuarioDb;
  return registro?.usuariowebid ?? registro?.UsuarioWebID ?? registro?.id ?? null;
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

export const useObtenerUsuariosRelacionados = (cadenavalorid) => {
  return useQuery({
    queryKey: ["usuarios", "relacionados", cadenavalorid],
    queryFn: () =>
      usuarioService.obtenerUsuariosRelacionados({ cadenavalorid }),
    enabled: !!cadenavalorid,
  });
};

export const useObtenerCadenasPorUsuario = (usuarioid) => {
  return useQuery({
    queryKey: ["usuarios", "cadenas_admin", usuarioid],
    queryFn: () => usuarioService.obtenerUsuariosRelacionados({ usuarioid }),
    enabled: !!usuarioid,
  });
};

export const useCrearUsuarioCadenaValor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => usuarioService.crearUsuarioCadenaValor(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["usuarios", "relacionados", variables.cadenavalorid],
      });
    },
  });
};

export const useActualizarUsuarioCadenaValor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      usuarioService.actualizarUsuarioCadenaValor(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["usuarios", "relacionados", variables.cadenavalorid],
      });
    },
  });
};

export const useActualizarUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuario) => usuarioService.actualizarUsuario(usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
};

import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { sociosService } from "../services/sociosService";
import { esSocioVacio } from "../utils/socioUtils";

export const useObtenerSocios = (params = {}) => {
  return useQuery({
    queryKey: ["socios", "lista", params],
    queryFn: () => sociosService.obtenerSocios(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
    placeholderData: keepPreviousData,
  });
};

export const useSocioPorId = (socioId) => {
  return useQuery({
    queryKey: ["socios", "detalle", socioId],
    queryFn: () => sociosService.obtenerSocioPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: keepPreviousData,
  });
};

const useCrearSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.crearSocio,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["socios", "lista"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error al crear el socio:", error);
    },
  });
};

export const useActualizarSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.actualizarSocio,
    onSuccess: (data, variables) => {
      return Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: ["socios", "lista"] }),
          variables.socioid &&
            queryClient
              .invalidateQueries({
                queryKey: ["socios", "detalle", variables.socioid],
              })
              .catch(() => {}),
        ].filter(Boolean),
      );
    },
    onError: (error) => {
      console.error("Error al actualizar el socio:", error);
    },
  });
};

export const useObtenerExecuteCda = (socioId) => {
  return useQuery({
    queryKey: ["socios", "executeCda", socioId],
    queryFn: () => sociosService.obtenerExecuteCda(socioId),
    enabled: !!socioId,
  });
};

export const useSocioWebPorId = (socioId) => {
  return useQuery({
    queryKey: ["sociosWeb", "detalle", socioId],
    queryFn: () => sociosService.obtenerSocioWebPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: keepPreviousData,
  });
};

// SocioUsuario solo devuelve { SocioID, UsuarioWebID, momentoCreacion } — no
// alcanza para saber si esa vinculación apunta a una empresa realmente
// registrada o a un socio "stub" (creado por cda/execute o por un intento de
// onboarding abandonado en el Paso 2, ver Paso1Cuit). Este hook trae el
// detalle de cada socio vinculado y filtra los vacíos, para que
// OnboardingGuard (y quien más lo necesite) no trate un stub como una
// empresa completa.
export const useEmpresasCompletas = (socioUsuarios) => {
  const lista = Array.isArray(socioUsuarios) ? socioUsuarios : [];
  const socioIds = lista
    .map((s) => s.socioid ?? s.SocioID ?? s.SocioId)
    .filter((id) => id !== undefined && id !== null);

  const resultados = useQueries({
    queries: socioIds.map((socioId) => ({
      queryKey: ["socios", "detalle", socioId],
      queryFn: () => sociosService.obtenerSocioPorId(socioId),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isLoading = resultados.some((r) => r.isPending);
  const empresasCompletas = resultados
    .map((r) => r.data)
    .filter((socio) => socio && !esSocioVacio(socio));

  return { empresasCompletas, isLoading };
};

export const useObtenerSocioUsuarioPorUsuarioId = (usuarioWebId) => {
  return useQuery({
    queryKey: ["socioUsuario", "listaPorUsuario", usuarioWebId],
    queryFn: () => sociosService.obtenerSocioUsuarioPorUsuarioId(usuarioWebId),
    enabled: !!usuarioWebId,
  });
};

const useVincularSocioUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.vincularSocioUsuario,
    onSuccess: (data, variables) => {
      return queryClient.invalidateQueries({
        queryKey: ["socioUsuario", "listaPorUsuario", variables.usuariowebid],
      });
    },
    onError: (error) => {
      console.error("Error al vincular el socio con el usuario:", error);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  requisitosService,
  DEFAULT_PHYSICAL_CONFIG,
  DEFAULT_SA_CONFIG,
  DEFAULT_SRL_CONFIG,
  DEFAULT_SH_CONFIG,
  DEFAULT_OTRAS_CONFIG,
  getFallbackConfig,
} from "../services/requisitosService";

const DEFAULT_REQUISITOS_FALLBACK = {
  fisica: DEFAULT_PHYSICAL_CONFIG,
  sa: DEFAULT_SA_CONFIG,
  srl: DEFAULT_SRL_CONFIG,
  sh: DEFAULT_SH_CONFIG,
  otras: DEFAULT_OTRAS_CONFIG,
};

/**
 * Hook para interactuar con la parametrización de requisitos por cadena de valor de forma asíncrona.
 * @param {number|string} cadenaId ID de la cadena de valor
 * @param {number|null} tipoPersonaId ID de tipo de persona (1 o 10)
 * @param {string|null} sociedad Nombre/denominación de la empresa para extraer el subtipo societario
 */
export const useRequisitos = (cadenaId, tipoPersonaId = undefined, sociedad = null) => {
  const queryClient = useQueryClient();
  const idNum = Number(cadenaId);
  const isClientMode = tipoPersonaId !== undefined;

  // Consulta asíncrona con clave reactiva que incluye tipoPersonaId y sociedad
  const query = useQuery({
    queryKey: ["requisitos", idNum, tipoPersonaId, sociedad],
    queryFn: () => requisitosService.obtenerRequisitosPorCadenaId(idNum, tipoPersonaId, sociedad, isClientMode),
    enabled: !!idNum,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  // Mutación para actualizar (usada principalmente en el panel de admin)
  const mutation = useMutation({
    mutationFn: (nuevaConfig) => requisitosService.guardarRequisitos(idNum, nuevaConfig),
    onSuccess: () => {
      // Invalidar todos los queries de requisitos para esta cadena
      queryClient.invalidateQueries({ queryKey: ["requisitos", idNum] });
    },
  });

  // Determinar el valor por defecto/fallback seguro según el modo
  const fallback = isClientMode
    ? getFallbackConfig(tipoPersonaId, sociedad)
    : DEFAULT_REQUISITOS_FALLBACK;

  const requisitos = query.data || fallback;

  return {
    requisitos,
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateRequisitos: mutation.mutate,
    isUpdating: mutation.isPending,
  };
};

export default useRequisitos;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tercerosService } from "../services/tercerosService";

//--------- TERCERO RELACIONADO ----------

export const useTerceros = (filtros = {}) => {
  return useQuery({
    queryKey: ["terceros", "lista", filtros],
    queryFn: () => tercerosService.obtenerTerceros(filtros),
    staleTime: 1000 * 60, // 1 minuto
  });
};

export const useTerceroPorId = (terceroId) => {
  return useQuery({
    queryKey: ["terceros", "detalle", terceroId],
    queryFn: () => tercerosService.obtenerTerceroPorId(terceroId),
    enabled: !!terceroId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useTiposHabilitadosTercero = (terceroId) => {
  return useQuery({
    queryKey: ["terceros", "tiposHabilitados", terceroId],
    queryFn: () => tercerosService.obtenerTiposHabilitados(terceroId),
    enabled: !!terceroId,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useCrearTercero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.crearTercero,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terceros", "lista"] });
    },
    onError: (error) => {
      console.error("Error al crear el tercero:", error);
    },
  });
};

//--------- SOCIO-TERCERO RELACIÓN ---------

export const useRelacionesDeSocio = (socioId) => {
  return useQuery({
    queryKey: ["relacionesSocio", socioId],
    queryFn: () => tercerosService.obtenerRelacionesDeSocio(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60,
  });
};

export const useGuardarRelacionesSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.guardarRelacionesDeSocio,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["relacionesSocio", variables.socioid],
      });
    },
    onError: (error) => {
      console.error("Error al guardar las relaciones del socio:", error);
    },
  });
};

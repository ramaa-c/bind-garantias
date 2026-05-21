import { useQuery, useMutation } from "@tanstack/react-query";
import { cdaService } from "../services/cdaService";

export const useObtenerGrupoCda = (grupoId, options = {}) => {
  return useQuery({
    queryKey: ["cda", "grupo", grupoId],
    queryFn: () => cdaService.obtenerGrupoCda(grupoId),
    enabled: !!grupoId,
    ...options,
  });
};

export const useObtenerCda = (cdaId, options = {}) => {
  return useQuery({
    queryKey: ["cda", "detalle", cdaId],
    queryFn: () => cdaService.obtenerCda(cdaId),
    enabled: !!cdaId,
    ...options,
  });
};

export const useObtenerPantallaGrupoCda = (pantalla, grupoId, options = {}) => {
  return useQuery({
    queryKey: ["cda", "pantallaGrupo", pantalla, grupoId],
    queryFn: () => cdaService.obtenerPantallaGrupoCda(pantalla, grupoId),
    enabled: !!pantalla && !!grupoId,
    ...options,
  });
};

export const useEjecutarCda = () => {
  return useMutation({
    mutationFn: (data) => cdaService.ejecutarCda(data),
  });
};

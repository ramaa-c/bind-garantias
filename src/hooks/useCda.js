import { useQuery, useMutation } from "@tanstack/react-query";
import { cdaService } from "../services/cdaService";

export const useObtenerGrupoCda = (pantalla, options = {}) => {
  return useQuery({
    queryKey: ["cda", "grupo", pantalla],
    queryFn: () => cdaService.obtenerGrupoCda(pantalla),
    enabled: !!pantalla,
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

export const useObtenerPantallaGrupoCda = (pantalla, options = {}) => {
  return useQuery({
    queryKey: ["cda", "pantallaGrupo", pantalla],
    queryFn: () => cdaService.obtenerPantallaGrupoCda(pantalla),
    enabled: !!pantalla,
    ...options,
  });
};

export const useEjecutarCda = () => {
  return useMutation({
    mutationFn: (data) => cdaService.ejecutarCda(data),
  });
};

export const useCrearCda = () => {
  return useMutation({
    mutationFn: (cdaData) => cdaService.crearCda(cdaData),
  });
};

export const useActualizarCda = () => {
  return useMutation({
    mutationFn: (cdaData) => cdaService.actualizarCda(cdaData),
  });
};

export const useObtenerTodosCdas = (options = {}) => {
  return useQuery({
    queryKey: ["cda", "todos_list"],
    queryFn: () => cdaService.obtenerTodosCdas(),
    ...options,
  });
};

export const useVincularPantallaCda = () => {
  return useMutation({
    mutationFn: (payload) => cdaService.vincularPantallaCda(payload),
  });
};

export const useProbarCda = () => {
  return useMutation({
    mutationFn: ({ cuit, expresion }) => cdaService.probarCda(cuit, expresion),
  });
};

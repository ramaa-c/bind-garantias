import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { variablesParametrizacionService } from "../services/variablesParametrizacionService";

const STALE_TIME = 1000 * 60 * 60 * 24;
const QUERY_KEY = ["variablesParametrizacion"];

export const useVariablesParametrizacion = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: variablesParametrizacionService.obtenerVariablesParametrizacion,
    staleTime: STALE_TIME,
  });

export const useCrearVariableParametrizacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variablesParametrizacionService.crear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useActualizarVariableParametrizacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variablesParametrizacionService.actualizar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

// Busca una variable puntual del catálogo global por su nombre (ej.
// "PorcentajeMinimoSolicitud") y devuelve su Valor numérico. undefined si
// todavía no cargó o no existe - el caller decide si eso bloquea o no.
export const useObtenerVariableParametrizacion = (nombreVariable) => {
  const { data, ...rest } = useVariablesParametrizacion();
  const arr = Array.isArray(data) ? data : [];
  const item = arr.find(
    (v) =>
      String(v.variable).toLowerCase() ===
      String(nombreVariable).toLowerCase(),
  );
  return { valor: item ? Number(item.valor) : undefined, ...rest };
};

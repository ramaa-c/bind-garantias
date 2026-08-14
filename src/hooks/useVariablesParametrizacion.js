import { useQuery } from "@tanstack/react-query";
import { variablesParametrizacionService } from "../services/variablesParametrizacionService";

const STALE_TIME = 1000 * 60 * 60 * 24;

export const useVariablesParametrizacion = () =>
  useQuery({
    queryKey: ["variablesParametrizacion"],
    queryFn: variablesParametrizacionService.obtenerVariablesParametrizacion,
    staleTime: STALE_TIME,
  });

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

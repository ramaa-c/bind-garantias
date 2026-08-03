import { useQuery } from "@tanstack/react-query";
import { nosisService } from "../services/nosisService";

export const useObtenerVariablesNosis = (cuit, options = {}) => {
  return useQuery({
    queryKey: ["nosis", "variables", cuit],
    queryFn: () => nosisService.obtenerVariables(cuit),
    enabled: !!cuit,
    ...options,
  });
};

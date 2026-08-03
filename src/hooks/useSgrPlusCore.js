import { useMutation } from "@tanstack/react-query";
import { sgrPlusCoreService } from "../services/sgrPlusCoreService";

export const useValidarUtilizacionCore = () => {
  return useMutation({
    mutationFn: (cuit) => sgrPlusCoreService.validarUtilizacion(cuit),
  });
};

export const useValidarSocioCore = () => {
  return useMutation({
    mutationFn: ({ cuit, cadenaValorId }) => sgrPlusCoreService.validarSocio(cuit, cadenaValorId),
  });
};

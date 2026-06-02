import { useMutation } from "@tanstack/react-query";
import { sgrPlusCoreService } from "../services/sgrPlusCoreService";

export const useValidarUtilizacionCore = () => {
  return useMutation({
    mutationFn: (socioId) => sgrPlusCoreService.validarUtilizacion(socioId),
  });
};

export const useValidarSocioCore = () => {
  return useMutation({
    mutationFn: ({ socioId, cadenaValorId }) => sgrPlusCoreService.validarSocio(socioId, cadenaValorId),
  });
};

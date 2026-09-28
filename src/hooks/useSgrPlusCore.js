import { useMutation, useQuery } from "@tanstack/react-query";
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

// Misma consulta que useValidarSocioCore, pero como query en vez de
// mutation: a diferencia del CDA, un rechazo de SGRPlusCore/ValidarSocio
// (mora, Protector/Postulante a Protector, etc.) no queda persistido en
// ningún historial consultable - hay que volver a preguntarle al endpoint
// cada vez que hace falta saber si un socio sigue bloqueado por esto (ver
// useBloqueoLegajo).
export const useEstadoValidarSocio = (cuit, cadenaValorId) => {
  return useQuery({
    queryKey: ["sgrPlusCore", "validarSocio", cuit, cadenaValorId],
    queryFn: () => sgrPlusCoreService.validarSocio(cuit, cadenaValorId),
    enabled: !!cuit && !!cadenaValorId,
    staleTime: 1000 * 60 * 2,
  });
};

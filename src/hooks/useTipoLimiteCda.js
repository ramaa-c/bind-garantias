import { useQuery, useMutation } from "@tanstack/react-query";
import { tipoLimiteCdaService } from "../services/tipoLimiteCdaService";

// Lectura pasiva (no crea nada): resuelve el GrupoCda de (Pantalla, Línea) y
// trae sus CDAs vinculados. Espejo de useObtenerGrupoCdaConCdas (cadena) en
// useCadenaValor.js.
export const useObtenerGrupoCdaConCdasLinea = (tipoLimiteId, pantalla) => {
  return useQuery({
    queryKey: ["tipoLimite", "grupoCdaConCdas", pantalla, tipoLimiteId],
    queryFn: async () => {
      const grupo = await tipoLimiteCdaService.obtenerGrupoCda(pantalla, tipoLimiteId);
      const grupoList = Array.isArray(grupo) ? grupo : grupo?.items || grupo?.data || (grupo ? [grupo] : []);
      const grupoRow = grupoList[0] || null;
      if (!grupoRow?.grupocdaid) return { grupo: null, cdas: [] };
      const cdas = await tipoLimiteCdaService.obtenerCdasPorGrupo(grupoRow.grupocdaid);
      return { grupo: grupoRow, cdas };
    },
    enabled: !!tipoLimiteId && !!pantalla,
  });
};

export const useVincularCdasAGrupoLinea = () => {
  return useMutation({
    mutationFn: (vinculacionData) => tipoLimiteCdaService.vincularCdasAGrupo(vinculacionData),
  });
};

export const useActualizarVinculacionCdaLinea = () => {
  return useMutation({
    mutationFn: (vinculacionData) => tipoLimiteCdaService.actualizarVinculacionCda(vinculacionData),
  });
};

export const useActualizarGrupoCdaLinea = () => {
  return useMutation({
    mutationFn: (grupoData) => tipoLimiteCdaService.actualizarGrupoCda(grupoData),
  });
};

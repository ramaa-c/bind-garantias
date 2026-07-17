import { useQuery } from "@tanstack/react-query";
import { valorOperativoService } from "../services/valorOperativoService";

export const useObtenerValorOperativo = (tipoLimiteOperativoId) => {
  return useQuery({
    queryKey: ["valorOperativo", tipoLimiteOperativoId],
    queryFn: () => valorOperativoService.obtenerValorOperativo(tipoLimiteOperativoId),
    enabled: !!tipoLimiteOperativoId,
    staleTime: 1000 * 60 * 30, // 30 min: este valor casi no cambia
  });
};

// "Dias postergacion nuevo balance": cuántos días de margen tiene un socio
// para actualizar su balance después de que cierra su ejercicio fiscal.
const ID_MARGEN_VENCIMIENTO_BALANCE = 59;

export const useDiasMargenVencimientoBalance = () => {
  const { data, isLoading } = useObtenerValorOperativo(ID_MARGEN_VENCIMIENTO_BALANCE);
  const dias = data?.importe ?? data?.Importe ?? null;
  return { dias: dias !== null ? Number(dias) : null, isLoading };
};

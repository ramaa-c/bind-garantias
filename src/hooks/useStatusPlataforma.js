import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statusPlataformaService } from "../services/statusPlataformaService";

// El intervalo corto (10s) es a propósito: además de mantener actualizada la
// pantalla de admin, esta misma caché es la que consulta el gate de
// api/axios.js antes de dejar salir cualquier request del cliente. Cuanto más
// corto el intervalo, menor la ventana en la que una acción de un usuario
// (alta, solicitud, carga de documentación) podría alcanzar a llegar al
// backend justo después de que la plataforma pasó a offline.
export const useObtenerStatusPlataforma = (options = {}) => {
  return useQuery({
    queryKey: ["statusPlataforma"],
    queryFn: statusPlataformaService.obtenerStatus,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    ...options,
  });
};

export const useActualizarStatusPlataforma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: statusPlataformaService.actualizarStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statusPlataforma"] });
    },
  });
};

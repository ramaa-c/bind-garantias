import { useAuthStore } from "../store/useAuthStore";
import { useChannel } from "../context/useChannel";

export const rutaInicioEmpresa = (basePath, hayLineaHabilitada) =>
  `${basePath}${hayLineaHabilitada ? "/solicitudes" : "/legajo"}`;

export const useRutaInicio = () => {
  const { basePath } = useChannel();
  const hayLineaHabilitada = useAuthStore((state) => state.isSolicitudesEnabled);
  return rutaInicioEmpresa(basePath, hayLineaHabilitada);
};

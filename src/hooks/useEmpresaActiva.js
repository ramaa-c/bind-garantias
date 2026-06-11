import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import {
  useObtenerSocioUsuarioPorUsuarioId,
  useSocioWebPorId,
} from "./useSocios";

export const useEmpresaActiva = () => {
  const user = useAuthStore((state) => state.user);
  const activeSocioId = useAuthStore((state) => state.activeSocioId);

  const { data: usuarioDb, isPending: isLoadingUser } =
    useObtenerPorNombreOEmail(user?.email);

  const usuarioWebId =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id || null;

  const {
    data: socioUsuarios,
    isPending: isPendingSocios,
  } = useObtenerSocioUsuarioPorUsuarioId(usuarioWebId);

  let socioId = activeSocioId;
  
  if (!socioId && Array.isArray(socioUsuarios) && socioUsuarios.length > 0) {
    socioId = socioUsuarios[0].socioid || socioUsuarios[0].SocioID;
  }

  const { data: socioWeb, isPending: isPendingSocioWeb } =
    useSocioWebPorId(socioId);

  const cuitActivo = socioWeb?.cuit || socioWeb?.Cuit || null;
  const nombreEmpresa =
    socioWeb?.denominacion || socioWeb?.Denominacion || null;
  const direccion = socioWeb?.calle || socioWeb?.Calle || "";
  const telefono = socioWeb?.telefono || socioWeb?.Telefono || "";
  const tipoPersonaId = socioWeb?.tipopersonaid || socioWeb?.TipoPersonaID || null;

  const isLoading = 
    isLoadingUser || 
    (usuarioWebId && isPendingSocios) || 
    (socioId && isPendingSocioWeb);

  return {
    cuitActivo,
    socioIdActivo: socioId,
    nombreEmpresa,
    direccion,
    telefono,
    tipoPersonaId,
    isLoading,
  };
};

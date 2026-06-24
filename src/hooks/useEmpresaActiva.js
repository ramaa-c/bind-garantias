import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import {
  useObtenerSocioUsuarioPorUsuarioId,
  useSocioWebPorId,
} from "./useSocios";
import { useVendor } from "./useVendor";

export const useEmpresaActiva = () => {
  const user = useAuthStore((state) => state.user);
  const activeSocioId = useAuthStore((state) => state.activeSocioId);

  const { data: usuarioDb, isPending: isLoadingUser } =
    useObtenerPorNombreOEmail(user?.email);

  const usuarioWebId =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id || null;

  const { data: socioUsuarios, isPending: isPendingSocios } =
    useObtenerSocioUsuarioPorUsuarioId(usuarioWebId);

  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;

  let socioId = activeSocioId;

  if (
    !socioId &&
    !isVendor &&
    Array.isArray(socioUsuarios) &&
    socioUsuarios.length > 0
  ) {
    socioId = socioUsuarios[0].socioid || socioUsuarios[0].SocioID;
  }

  const { data: socioWeb, isPending: isPendingSocioWeb } =
    useSocioWebPorId(socioId);

  const cuitActivo = socioWeb?.cuit || socioWeb?.Cuit || null;
  const nombreEmpresa =
    socioWeb?.denominacion || socioWeb?.Denominacion || null;
  const direccion = socioWeb?.calle || socioWeb?.Calle || "";
  const telefono = socioWeb?.telefono || socioWeb?.Telefono || "";
  let tipoPersonaId =
    socioWeb?.tipopersonaid || socioWeb?.TipoPersonaID || null;
  if (!tipoPersonaId && cuitActivo) {
    const cleanCuit = String(cuitActivo).replace(/\D/g, "");
    const prefix = cleanCuit.substring(0, 2);
    if (
      ["20", "23", "24", "27", "25", "26"].includes(prefix) ||
      cleanCuit.startsWith("2")
    ) {
      tipoPersonaId = 1;
    } else if (
      ["30", "33", "34"].includes(prefix) ||
      cleanCuit.startsWith("3")
    ) {
      tipoPersonaId = 10;
    }
  }

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

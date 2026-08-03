import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import {
  useObtenerSocioUsuarioPorUsuarioId,
  useSocioWebPorId,
} from "./useSocios";
import { useVendor } from "./useVendor";

export const useEmpresaActiva = (skip = false) => {
  const user = useAuthStore((state) => state.user);
  const activeSocioId = useAuthStore((state) => state.activeSocioId);

  const { data: usuarioDb, isPending: isLoadingUser } =
    useObtenerPorNombreOEmail(skip ? undefined : user?.email);

  const usuarioWebId =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id || null;

  const { data: socioUsuarios, isPending: isPendingSocios } =
    useObtenerSocioUsuarioPorUsuarioId(skip ? undefined : usuarioWebId);

  const { data: vendorData } = useVendor(skip);
  const isVendor = vendorData?.isVendor || false;

  let socioId = skip ? null : activeSocioId;

  if (
    !skip &&
    !socioId &&
    !isVendor &&
    Array.isArray(socioUsuarios) &&
    socioUsuarios.length > 0
  ) {
    socioId = socioUsuarios[0].socioid || socioUsuarios[0].SocioID;
  }

  const { data: socioWeb, isPending: isPendingSocioWeb } =
    useSocioWebPorId(skip ? undefined : socioId);

  const cuitActivo = socioWeb?.cuit || socioWeb?.Cuit || null;
  const nombreEmpresa =
    socioWeb?.denominacion || socioWeb?.Denominacion || null;
  const direccion = socioWeb?.calle || socioWeb?.Calle || "";
  const numero = socioWeb?.numero || socioWeb?.Numero || "";
  const piso = socioWeb?.piso || socioWeb?.Piso || "";
  const departamento = socioWeb?.departamento || socioWeb?.Departamento || "";
  const partido = socioWeb?.partido || socioWeb?.Partido || "";
  const codigoPostal = socioWeb?.codpos || socioWeb?.CodPos || "";
  const email = socioWeb?.email || socioWeb?.Email || "";
  const telefono = socioWeb?.telefono || socioWeb?.Telefono || "";
  const telefono2 = socioWeb?.telefono2 || socioWeb?.Telefono2 || "";
  const fechaCierreEjercicio =
    socioWeb?.fechacierreejercicio || socioWeb?.FechaCierreEjercicio || null;
  const fechaInicioActividades =
    socioWeb?.fechainicioactividades || socioWeb?.FechaInicioActividades || null;
  const tamanioEmpresaId =
    Number(socioWeb?.tamanioempresaid ?? socioWeb?.TamanioEmpresaID) || null;
  const situacionBcraId =
    Number(socioWeb?.situacionbcraid ?? socioWeb?.SituacionBcraID) || null;
  const tipoCanalComercializacionId =
    Number(
      socioWeb?.tipocanalcomercializacionid ??
        socioWeb?.TipoCanalComercializacionID,
    ) || null;
  const socioEstadoId =
    Number(socioWeb?.socioestadoid ?? socioWeb?.SocioEstadoID) || null;
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

  // El socio ya tiene denominación real desde que cruza el "umbral" en
  // Paso1Cuit (POST antes del CDA), aunque todavía le falte completar el
  // Paso 2 (el teléfono es el campo que marca eso). Por eso nombreEmpresa
  // truthy ya NO alcanza para decidir si mostrar navegación plena — hace
  // falta este flag aparte, para no romper a los demás consumidores de
  // nombreEmpresa/cuitActivo que sí necesitan mostrarlos aunque el
  // onboarding no esté 100% terminado.
  const onboardingCompleto = !!nombreEmpresa && !!telefono;

  return {
    cuitActivo,
    socioIdActivo: socioId,
    nombreEmpresa,
    direccion,
    numero,
    piso,
    departamento,
    partido,
    codigoPostal,
    email,
    telefono,
    telefono2,
    fechaCierreEjercicio,
    fechaInicioActividades,
    tamanioEmpresaId,
    situacionBcraId,
    tipoCanalComercializacionId,
    socioEstadoId,
    tipoPersonaId,
    onboardingCompleto,
    isLoading,
  };
};

import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import {
  useObtenerSocioUsuarioPorUsuarioId,
  useEmpresasCompletas,
} from "./useSocios";
import {
  useAsistenciaInterna,
  separarEmpresasAsistidas,
} from "./useAsistenciaInterna";
import { extraerRegistroUsuario } from "../utils/usuarioUtils";

export const ROL_EMPRESA_ADMIN = "admin";
export const ROL_EMPRESA_USUARIO = "usuario";
export const ROL_EMPRESA_ASISTENCIA = "asistencia";

const parsearLista = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.data) return data.data;
  if (typeof data === "object" && Object.keys(data).length > 0) return [data];
  return [];
};

export const useEmpresasDelUsuario = (skip = false) => {
  const email = useAuthStore((state) => state.user?.email);
  const { data: usuarioDb, isPending: cargandoUsuario } =
    useObtenerPorNombreOEmail(skip ? "" : email);
  const registro = extraerRegistroUsuario(usuarioDb);
  const usuarioWebId =
    registro?.usuariowebid || registro?.UsuarioWebID || registro?.id || null;

  const { data: socioUsuarios, isPending: cargandoVinculos } =
    useObtenerSocioUsuarioPorUsuarioId(skip ? 0 : usuarioWebId || 0);
  const { vigentesQueAtiendo, cargando: cargandoAsistencias } =
    useAsistenciaInterna({ habilitado: !skip });
  const vinculos = parsearLista(socioUsuarios);
  const { propias, asistidas } = separarEmpresasAsistidas(
    vinculos,
    vigentesQueAtiendo,
  );
  const { empresasCompletas, isLoading: cargandoEmpresas } =
    useEmpresasCompletas(skip || cargandoAsistencias ? [] : propias);

  const adminPorSocio = new Map(
    vinculos.map((v) => [
      String(v.socioid ?? v.SocioID ?? ""),
      String(v.esadministradorcuit ?? v.EsAdministradorCuit ?? "") === "1",
    ]),
  );
  const empresas = [
    ...empresasCompletas.map((socio) => {
      const socioId = socio.socioid ?? socio.SocioID;
      return {
        socioId,
        nombre: socio.denominacion || socio.Denominacion || "",
        cuit: String(socio.cuit || socio.Cuit || ""),
        rol: adminPorSocio.get(String(socioId))
          ? ROL_EMPRESA_ADMIN
          : ROL_EMPRESA_USUARIO,
        esAsistencia: false,
        socio,
      };
    }),
    ...asistidas.map((a) => ({
      socioId: a.socioid,
      nombre: a.denominacion || "",
      cuit: String(a.cuit || ""),
      rol: ROL_EMPRESA_ASISTENCIA,
      esAsistencia: true,
      asistencia: a.asistencia,
      socio: null,
    })),
  ];

  return {
    empresas,
    cargando:
      !skip &&
      ((cargandoUsuario && !usuarioWebId) ||
        cargandoAsistencias ||
        (!!usuarioWebId && (cargandoVinculos || cargandoEmpresas))),
  };
};

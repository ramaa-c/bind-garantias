import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { useChannel } from "../context/useChannel";
import { useCadenaActiva } from "./useCadenaActiva";
import { useUsuariosVinculadosASocio } from "./useSocios";
import { useTipoCanalComercializacion } from "./useCatalogos";
import { useObtenerCadenaPublicaWeb } from "./useCadenaValor";
import { useAsistenciaInterna, CLAVE_ASISTENCIAS } from "./useAsistenciaInterna";
import { sociosService } from "../services/sociosService";
import { usuarioVinculacionService } from "../services/usuarioVinculacionService";
import { mensajeNegocio } from "../utils/mensajesError";
import { obtenerDatosTokenApi } from "../api/tokenApi";

export const ROL_ADMIN = "admin";
export const ROL_USUARIO = "usuario";
export const ESTADO_VINCULADO = "vinculado";
export const ESTADO_INVITACION = "invitacion";

export const RESULTADO_INVITADA = "invitada";
export const RESULTADO_VINCULADA = "vinculada";

const MENSAJE_SIN_PERMISO = "Solo los administradores de la empresa pueden hacer esto.";
const MENSAJE_ULTIMO_ADMIN = "El CUIT debe tener al menos un administrador.";
const MENSAJE_LIMITE = "Hiciste muchos pedidos seguidos. Probá de nuevo en un rato.";

const errorAmigable = (error, porDefecto, mensaje409) => {
  const status = error?.response?.status;
  if (status === 403) return new Error(MENSAJE_SIN_PERMISO);
  if (status === 429) return new Error(MENSAJE_LIMITE);
  if (status === 409 && mensaje409) return new Error(mensaje409);
  return new Error(mensajeNegocio(error, porDefecto));
};

const mismoEmail = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

export const useUsuariosEmpresa = ({ socioId, cuit, tipoCanalSocioId, esVendor = false }) => {
  const queryClient = useQueryClient();
  const emailPropio = String(useAuthStore((state) => state.user?.email) || "").toLowerCase();
  const { basePath } = useChannel();
  const { cadenaId } = useCadenaActiva();
  const miUsuarioWebId = obtenerDatosTokenApi()?.usuarioWebId ?? null;
  const { usuariosVinculados, isLoading } = useUsuariosVinculadosASocio(socioId);
  const { data: canales } = useTipoCanalComercializacion();
  const { data: cadenaWeb } = useObtenerCadenaPublicaWeb(cadenaId);
  const { asistenciaQueAtiendo, asistenciaPedida } = useAsistenciaInterna();

  const vinculados = useMemo(
    () =>
      usuariosVinculados.map((u) => {
        const esVos = !!miUsuarioWebId && String(u.usuarioWebId) === String(miUsuarioWebId);
        return {
          id: String(u.usuarioWebId),
          usuarioWebId: u.usuarioWebId,
          email: (esVos && emailPropio) || u.email || `Usuario #${u.usuarioWebId}`,
          rol: u.esAdministradorCuit ? ROL_ADMIN : ROL_USUARIO,
          estado: ESTADO_VINCULADO,
          desde: u.momentoCreacion || null,
          esVos,
        };
      }),
    [usuariosVinculados, emailPropio, miUsuarioWebId],
  );

  const yo = vinculados.find((u) => u.esVos);
  const soyAdmin = yo?.rol === ROL_ADMIN;
  const soyAsistente = !!asistenciaQueAtiendo(socioId);
  const cuitLimpio = String(cuit || "").replace(/\D/g, "");

  const { data: invitacionesApi, isPending: cargandoInvitaciones } = useQuery({
    queryKey: ["usuarioVinculacion", "lista", cuitLimpio],
    queryFn: () => usuarioVinculacionService.listarInvitaciones(cuitLimpio),
    enabled: soyAdmin && !!cuitLimpio,
    staleTime: 1000 * 60,
  });

  const usuarios = useMemo(() => {
    const invitados = (invitacionesApi || [])
      .filter((inv) => String(inv.vinculado ?? "") !== "1")
      .filter((inv) => !vinculados.some((u) => mismoEmail(u.email, inv.email)))
      .map((inv) => ({
        id: `inv-${String(inv.email || "").toLowerCase()}`,
        usuarioWebId: null,
        email: inv.email || "",
        nombre: inv.denominacion || "",
        rol: ROL_USUARIO,
        estado: ESTADO_INVITACION,
        desde: null,
        esVos: false,
      }));
    const ordenados = [...vinculados].sort((a, b) => {
      if (a.esVos !== b.esVos) return a.esVos ? -1 : 1;
      if (a.rol !== b.rol) return a.rol === ROL_ADMIN ? -1 : 1;
      return a.email.localeCompare(b.email, "es");
    });
    return [...ordenados, ...invitados];
  }, [vinculados, invitacionesApi]);

  const cantidadAdmins = vinculados.filter((u) => u.rol === ROL_ADMIN).length;
  const primerUsuarioEsAdmin = esVendor && !vinculados.some((u) => !u.esVos);

  const cadena = Array.isArray(cadenaWeb) ? cadenaWeb[0] : cadenaWeb;
  const canalId = Number(cadena?.tipocanalcomercializacionid) || Number(tipoCanalSocioId) || null;
  const canal = (canales?.raw || []).find((c) => Number(c.tipocanalcomercializacionid) === canalId);
  const asistenciaDisponible =
    !soyAsistente && !!yo && String(canal?.observaciones ?? canal?.Observaciones ?? "").trim() !== "";

  const frontUrl = window.location.origin + basePath;

  const refrescarVinculados = () =>
    queryClient.invalidateQueries({ queryKey: ["socioUsuario", "listaPorSocio", socioId] });
  const refrescarInvitaciones = () =>
    queryClient.invalidateQueries({ queryKey: ["usuarioVinculacion", "lista", cuitLimpio] });

  const invitar = async ({ email, nombre }) => {
    const normalizado = email.trim().toLowerCase();
    if (vinculados.some((u) => mismoEmail(u.email, normalizado))) {
      throw new Error("Esa persona ya tiene acceso a la empresa.");
    }
    try {
      await usuarioVinculacionService.invitar({
        cuit: cuitLimpio,
        email: normalizado,
        denominacion: nombre.trim(),
        fronturl: frontUrl,
      });
      await refrescarInvitaciones();
      return RESULTADO_INVITADA;
    } catch (error) {
      if (error?.response?.status !== 409) {
        throw errorAmigable(error, "No pudimos enviar la invitación. Probá de nuevo.");
      }
    }
    try {
      await sociosService.vincularUsuarioPorEmail({
        socioId,
        email: normalizado,
        esAdministradorCuit: primerUsuarioEsAdmin ? "1" : "0",
      });
      await Promise.all([refrescarVinculados(), refrescarInvitaciones()]);
      return RESULTADO_VINCULADA;
    } catch (error) {
      throw errorAmigable(error, "No pudimos darle acceso. Probá de nuevo.", "Esa persona ya tiene acceso a la empresa.");
    }
  };

  const reenviar = async (usuario) => {
    try {
      await usuarioVinculacionService.invitar({
        cuit: cuitLimpio,
        email: usuario.email,
        denominacion: usuario.nombre || usuario.email.split("@")[0],
        fronturl: frontUrl,
      });
      await refrescarInvitaciones();
    } catch (error) {
      throw errorAmigable(error, "No pudimos reenviar la invitación. Probá de nuevo.");
    }
  };

  const cambiarRol = async (usuario, rol) => {
    try {
      await sociosService.cambiarRolSocioUsuario({
        socioId,
        usuarioWebId: usuario.usuarioWebId,
        esAdministradorCuit: rol === ROL_ADMIN ? "1" : "0",
      });
      await refrescarVinculados();
    } catch (error) {
      throw errorAmigable(error, "No pudimos cambiar el rol. Probá de nuevo.", MENSAJE_ULTIMO_ADMIN);
    }
  };

  const quitarAcceso = async (usuario) => {
    try {
      await sociosService.desvincularSocioUsuario({ socioId, usuarioWebId: usuario.usuarioWebId });
      await Promise.all([refrescarVinculados(), refrescarInvitaciones()]);
    } catch (error) {
      throw errorAmigable(error, "No pudimos quitarle el acceso. Probá de nuevo.", MENSAJE_ULTIMO_ADMIN);
    }
  };

  const solicitarAsistencia = async () => {
    try {
      await usuarioVinculacionService.solicitarAsistencia({ cuit: cuitLimpio, fronturl: frontUrl });
      await queryClient.invalidateQueries({ queryKey: CLAVE_ASISTENCIAS });
    } catch (error) {
      throw errorAmigable(
        error,
        "No pudimos pedir la asistencia. Probá de nuevo.",
        mensajeNegocio(error, "Para pedir asistencia, ingresá desde el sitio de tu entidad."),
      );
    }
  };

  return {
    usuarios,
    cargando: isLoading || (soyAdmin && !!cuitLimpio && cargandoInvitaciones),
    soyAdmin,
    soyAsistente,
    cantidadAdmins,
    primerUsuarioEsAdmin,
    asistenciaDisponible,
    asistencia: asistenciaPedida(socioId),
    invitar,
    reenviar,
    cambiarRol,
    quitarAcceso,
    solicitarAsistencia,
  };
};

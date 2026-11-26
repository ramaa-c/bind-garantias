import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { useChannel } from "../context/useChannel";
import { useSocioWebPorId, useUsuariosVinculadosASocio } from "./useSocios";
import { useAsistenciaInterna } from "./useAsistenciaInterna";
import { sociosService } from "../services/sociosService";
import { usuarioVinculacionService } from "../services/usuarioVinculacionService";
import { normalizarClaves } from "../utils/normalizarClaves";
import { mensajeNegocio } from "../utils/mensajesError";
import { obtenerDatosTokenApi } from "../api/tokenApi";

export const ROL_ADMIN = "admin";
export const ROL_USUARIO = "usuario";
export const ROL_VENDOR = "vendor";
export const ESTADO_VINCULADO = "vinculado";
export const ESTADO_INVITACION = "invitacion";

export const RESULTADO_INVITADA = "invitada";
export const RESULTADO_VINCULADA = "vinculada";

const MENSAJE_SIN_PERMISO = "Solo los administradores de la empresa pueden hacer esto.";
const MENSAJE_EMPRESA_CEDIDA =
  "La empresa ya tiene su propio administrador: desde ahora los accesos los maneja la empresa.";
const MENSAJE_ULTIMO_ADMIN = "El CUIT debe tener al menos un administrador.";
const MENSAJE_LIMITE = "Hiciste muchos pedidos seguidos. Probá de nuevo en un rato.";
const MENSAJE_CUIT_NO_VINCULADO = "No encontramos la empresa entre las que podés administrar.";

const errorAmigable = (error, porDefecto, { mensaje403 = MENSAJE_SIN_PERMISO, mensaje409 } = {}) => {
  const status = error?.response?.status;
  if (status === 403) return new Error(mensaje403);
  if (status === 429) return new Error(MENSAJE_LIMITE);
  if (status === 409) return new Error(mensajeNegocio(error, mensaje409 || porDefecto));
  return new Error(mensajeNegocio(error, porDefecto));
};

const mismoEmail = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

export const useUsuariosEmpresa = ({ socioId, cuit, esVendor = false }) => {
  const queryClient = useQueryClient();
  const emailPropio = String(useAuthStore((state) => state.user?.email) || "").toLowerCase();
  const { basePath } = useChannel();
  const miUsuarioWebId = obtenerDatosTokenApi()?.usuarioWebId ?? null;
  const { usuariosVinculados, isLoading } = useUsuariosVinculadosASocio(socioId);
  const { data: socioWeb, isPending: cargandoEmpresa } = useSocioWebPorId(esVendor ? socioId : undefined);
  const { asistenciaQueAtiendo, asistenciaPedida } = useAsistenciaInterna();

  const vinculados = useMemo(
    () =>
      usuariosVinculados.map((u) => {
        const esVos = !!miUsuarioWebId && String(u.usuarioWebId) === String(miUsuarioWebId);
        return {
          id: String(u.usuarioWebId),
          usuarioWebId: u.usuarioWebId,
          email: (esVos && emailPropio) || u.email || `Usuario #${u.usuarioWebId}`,
          // El vendor opera la empresa con su propio rol, nunca como
          // administrador del CUIT (aunque el vínculo diga lo contrario).
          // Para los demás, EsVendorCadena dice si es vendor de la cadena por
          // la que se ingresó.
          rol: (esVos ? esVendor : u.esVendorCadena) ? ROL_VENDOR : u.esAdministradorCuit ? ROL_ADMIN : ROL_USUARIO,
          estado: ESTADO_VINCULADO,
          desde: u.momentoCreacion || null,
          esVos,
        };
      }),
    [usuariosVinculados, emailPropio, miUsuarioWebId, esVendor],
  );

  const yo = vinculados.find((u) => u.esVos);
  const soyAdmin = yo?.rol === ROL_ADMIN;
  // "Empresa sin ceder" es la que dio de alta un vendor y todavía no tiene
  // correo (definición de la API): quien invite el vendor queda como
  // administrador y, al cederla, la empresa toma su correo. Los usuarios
  // vinculados no alcanzan para saberlo: un vendor de otra cadena puede
  // haberla recibido o haberla dado de alta. El rol lo decide la API; esto
  // es solo para el aviso, el botón de invitar y el paso del panel.
  const emailEmpresa = String(socioWeb?.email || socioWeb?.Email || "").trim();
  const empresaSinCeder = esVendor && !!socioId && !cargandoEmpresa && !emailEmpresa;
  // El vendor invita a la empresa (mail de bienvenida) sin ser administrador,
  // solo hasta cederla; cambiar roles o quitar accesos sigue siendo solo de
  // los administradores.
  const puedeInvitar = soyAdmin || empresaSinCeder;
  const soyAsistente = !!asistenciaQueAtiendo(socioId);
  const cuitLimpio = String(cuit || "").replace(/\D/g, "");

  const { data: invitacionesApi, isPending: cargandoInvitaciones } = useQuery({
    queryKey: ["usuarioVinculacion", "lista", cuitLimpio],
    queryFn: () => usuarioVinculacionService.listarInvitaciones(cuitLimpio),
    enabled: puedeInvitar && !!cuitLimpio,
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
    const visibles = esVendor ? vinculados : vinculados.filter((u) => u.rol !== ROL_VENDOR);
    const ordenados = [...visibles].sort((a, b) => {
      if (a.esVos !== b.esVos) return a.esVos ? -1 : 1;
      if (a.rol !== b.rol) return a.rol === ROL_ADMIN ? -1 : 1;
      return a.email.localeCompare(b.email, "es");
    });
    return [...ordenados, ...invitados];
  }, [vinculados, invitacionesApi, esVendor]);

  const cantidadAdmins = vinculados.filter((u) => u.rol === ROL_ADMIN).length;

  const frontUrl = window.location.origin + basePath;

  const refrescarVinculados = () =>
    queryClient.invalidateQueries({ queryKey: ["socioUsuario", "listaPorSocio", socioId] });
  const refrescarEmpresa = () => queryClient.invalidateQueries({ queryKey: ["sociosWeb", "detalle", socioId] });
  const refrescarInvitaciones = () =>
    queryClient.invalidateQueries({ queryKey: ["usuarioVinculacion", "lista", cuitLimpio] });

  const mensaje403 = esVendor ? MENSAJE_EMPRESA_CEDIDA : MENSAJE_SIN_PERMISO;

  const invitar = async ({ email, nombre }) => {
    const normalizado = email.trim().toLowerCase();
    if (vinculados.some((u) => mismoEmail(u.email, normalizado))) {
      throw new Error("Esa persona ya tiene acceso a la empresa.");
    }
    let respuesta;
    try {
      respuesta = await usuarioVinculacionService.invitar({
        cuit: cuitLimpio,
        email: normalizado,
        denominacion: String(nombre || "").trim() || undefined,
        fronturl: frontUrl,
      });
    } catch (error) {
      if (error?.response?.status === 404) throw new Error(MENSAJE_CUIT_NO_VINCULADO);
      throw errorAmigable(error, "No pudimos sumar a esa persona. Probá de nuevo.", {
        mensaje403,
        mensaje409: "Ese correo no se puede vincular a la empresa.",
      });
    }
    const datos = normalizarClaves(Array.isArray(respuesta) ? respuesta[0] : respuesta);
    const resultado =
      String(datos.resultado || "").trim().toLowerCase() === RESULTADO_VINCULADA
        ? RESULTADO_VINCULADA
        : RESULTADO_INVITADA;
    if (resultado === RESULTADO_VINCULADA) {
      await Promise.all([refrescarVinculados(), refrescarInvitaciones(), refrescarEmpresa()]);
    } else {
      await refrescarInvitaciones();
    }
    return { resultado, esAdministradorCuit: String(datos.esadministradorcuit ?? "") === "1" };
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
      throw errorAmigable(error, "No pudimos reenviar la invitación. Probá de nuevo.", { mensaje403 });
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
      throw errorAmigable(error, "No pudimos cambiar el rol. Probá de nuevo.", { mensaje409: MENSAJE_ULTIMO_ADMIN });
    }
  };

  const quitarAcceso = async (usuario) => {
    try {
      await sociosService.desvincularSocioUsuario({ socioId, usuarioWebId: usuario.usuarioWebId });
      await Promise.all([refrescarVinculados(), refrescarInvitaciones()]);
    } catch (error) {
      throw errorAmigable(error, "No pudimos quitarle el acceso. Probá de nuevo.", { mensaje409: MENSAJE_ULTIMO_ADMIN });
    }
  };

  return {
    usuarios,
    cargando: isLoading || (puedeInvitar && !!cuitLimpio && cargandoInvitaciones),
    soyAdmin,
    puedeInvitar,
    soyAsistente,
    cantidadAdmins,
    empresaSinCeder,
    asistencia: asistenciaPedida(socioId),
    invitar,
    reenviar,
    cambiarRol,
    quitarAcceso,
  };
};

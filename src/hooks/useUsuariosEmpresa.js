import { useMemo } from "react";
import { create } from "zustand";
import { useAuthStore } from "../store/useAuthStore";
import { useUsuariosVinculadosASocio } from "./useSocios";
import { useTipoCanalComercializacion } from "./useCatalogos";

export const ZONA_USUARIOS_HABILITADA = import.meta.env.DEV;

export const ROL_ADMIN = "admin";
export const ROL_USUARIO = "usuario";
export const ESTADO_VINCULADO = "vinculado";
export const ESTADO_INVITACION = "invitacion";

const HORAS_ASISTENCIA_DEMO = 48;
const DEMO_VACIO = { roles: {}, invitaciones: [], bajas: [], asistencia: null };

const useDemoStore = create((set) => ({
  porSocio: {},
  verComoUsuario: false,
  actualizar: (socioId, cambio) =>
    set((estado) => {
      const actual = estado.porSocio[socioId] || { roles: {}, invitaciones: [], bajas: [], asistencia: null };
      return { porSocio: { ...estado.porSocio, [socioId]: { ...actual, ...cambio(actual) } } };
    }),
  setVerComoUsuario: (valor) => set({ verComoUsuario: valor }),
}));

const esperar = (ms = 450) => new Promise((resolver) => setTimeout(resolver, ms));

export const useUsuariosEmpresa = (socioId, tipoCanalComercializacionId) => {
  const emailPropio = String(useAuthStore((state) => state.user?.email) || "").toLowerCase();
  const { usuariosVinculados, isLoading } = useUsuariosVinculadosASocio(socioId);
  const { data: canales } = useTipoCanalComercializacion();
  const demo = useDemoStore((state) => state.porSocio[socioId]) || DEMO_VACIO;
  const verComoUsuario = useDemoStore((state) => state.verComoUsuario);
  const setVerComoUsuario = useDemoStore((state) => state.setVerComoUsuario);
  const actualizar = useDemoStore((state) => state.actualizar);

  const usuarios = useMemo(() => {
    const vinculados = usuariosVinculados
      .filter((u) => !demo.bajas.includes(String(u.usuarioWebId)))
      .map((u) => {
        const email = String(u.email || "").toLowerCase();
        const esVos = !!email && email === emailPropio;
        const id = String(u.usuarioWebId);
        return {
          id,
          email: u.email || `Usuario #${u.usuarioWebId}`,
          rol: demo.roles[id] || (esVos ? ROL_ADMIN : ROL_USUARIO),
          estado: ESTADO_VINCULADO,
          desde: u.momentoCreacion || null,
          esVos,
        };
      });
    const invitados = demo.invitaciones.map((inv) => ({
      id: `inv-${inv.email}`,
      email: inv.email,
      rol: demo.roles[`inv-${inv.email}`] || inv.rol,
      estado: ESTADO_INVITACION,
      desde: inv.enviadaEl,
      esVos: false,
    }));
    return [...vinculados, ...invitados].sort((a, b) => {
      if (a.esVos !== b.esVos) return a.esVos ? -1 : 1;
      if (a.rol !== b.rol) return a.rol === ROL_ADMIN ? -1 : 1;
      return a.email.localeCompare(b.email, "es");
    });
  }, [usuariosVinculados, demo, emailPropio]);

  const yo = usuarios.find((u) => u.esVos);
  const soyAdmin = !verComoUsuario && yo?.rol === ROL_ADMIN;
  const cantidadAdmins = usuarios.filter((u) => u.rol === ROL_ADMIN && u.estado === ESTADO_VINCULADO).length;

  const canal = (canales?.raw || []).find(
    (c) => Number(c.tipocanalcomercializacionid) === Number(tipoCanalComercializacionId),
  );
  const asistenciaDisponible = String(canal?.observaciones ?? canal?.Observaciones ?? "").trim() !== "";

  const invitar = async ({ email, esAdmin }) => {
    await esperar();
    const normalizado = email.trim().toLowerCase();
    if (usuarios.some((u) => u.email.toLowerCase() === normalizado)) {
      throw new Error("Esa persona ya tiene acceso a la empresa o tiene una invitación pendiente.");
    }
    actualizar(socioId, (actual) => ({
      invitaciones: [
        ...actual.invitaciones,
        { email: normalizado, rol: esAdmin ? ROL_ADMIN : ROL_USUARIO, enviadaEl: new Date().toISOString() },
      ],
    }));
  };

  const cambiarRol = async (usuario, rol) => {
    await esperar(300);
    actualizar(socioId, (actual) => ({ roles: { ...actual.roles, [usuario.id]: rol } }));
  };

  const quitarAcceso = async (usuario) => {
    await esperar(300);
    actualizar(socioId, (actual) =>
      usuario.estado === ESTADO_INVITACION
        ? { invitaciones: actual.invitaciones.filter((inv) => `inv-${inv.email}` !== usuario.id) }
        : { bajas: [...actual.bajas, usuario.id] },
    );
  };

  const solicitarAsistencia = async () => {
    await esperar();
    const ahora = new Date();
    actualizar(socioId, () => ({
      asistencia: {
        solicitadaEl: ahora.toISOString(),
        horas: HORAS_ASISTENCIA_DEMO,
      },
    }));
  };

  return {
    usuarios,
    cargando: isLoading,
    soyAdmin,
    cantidadAdmins,
    asistenciaDisponible,
    asistencia: demo.asistencia,
    invitar,
    cambiarRol,
    quitarAcceso,
    solicitarAsistencia,
    esDemo: true,
    verComoUsuario,
    setVerComoUsuario,
  };
};

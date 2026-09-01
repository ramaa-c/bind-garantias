import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setLastActivity, clearLastActivity } from "../utils/sessionActivity";

// Compartido por clearAuth (logout real) y cambiarEmpresa (logout "suave",
// ver más abajo): tira todo lo efímero de una sesión/intento de onboarding —
// sessionStorage completo (altaEmpresaPendiente, drafts de useFormPersist,
// locks de migración, etc.) y los drafts en localStorage (draft_*, ver
// AltaOperacion.jsx) — sin tocar nada de auth.
const limpiarStorageEfimero = () => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.clear();
  } catch (e) {
    console.error("Error clearing sessionStorage:", e);
  }

  try {
    if (window.localStorage) {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("draft_")) {
          window.localStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    console.error("Error clearing localStorage drafts:", e);
  }
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeSocioId: null,
      isSolicitudesEnabled: true,
      // Si ya se verificó (o no hace falta) la aceptación de los Términos y
      // Condiciones vigentes en esta sesión de login. Se resetea en cada
      // setUser/clearAuth para que, si se publica una versión nueva, recién
      // se vuelva a pedir en el próximo login (no interrumpe una sesión activa).
      terminosVerificado: false,

      setActiveSocioId: (socioId) => set({ activeSocioId: socioId }),
      setSolicitudesEnabled: (enabled) => set({ isSolicitudesEnabled: enabled }),
      setTerminosVerificado: (verificado) => set({ terminosVerificado: verificado }),

      // esNuevoLogin distingue un login real de los usos "de parche" que
      // reescriben el user ya logueado (AdminGuard corrigiendo el nombre
      // mostrado, CuentaUsuarioModal tras renombrarse) - solo el primero
      // debe arrancar de cero: sin el flag, activeSocioId/sessionStorage de
      // una sesión anterior en el mismo navegador (propia o de otro
      // usuario) sobrevivían al login y el OnboardingGuard mandaba a un
      // vendor directo a /legajo con esa empresa vieja, salteando
      // /seleccionar-empresa.
      setUser: (userData, { esNuevoLogin = false } = {}) => {
        if (!userData) {
          set({ user: null, isAuthenticated: false, activeSocioId: null, terminosVerificado: false });
          return;
        }

        const { hashseguridad: _hashseguridad, ...safeUser } = userData;

        if (esNuevoLogin) {
          limpiarStorageEfimero();
        }

        // Marca el arranque del reloj de inactividad justo en el login -
        // así, cuando useSessionTimeout recalcule el tiempo restante (al
        // montar, al volver de background, o en otra pestaña), parte de "0
        // segundos transcurridos" y no de un timestamp viejo/inexistente.
        setLastActivity();

        set({
          user: safeUser,
          isAuthenticated: true,
          ...(esNuevoLogin ? { activeSocioId: null } : {}),
          terminosVerificado: false,
        });
      },

      clearAuth: () => {
        clearLastActivity();
        limpiarStorageEfimero();
        set({
          user: null,
          isAuthenticated: false,
          activeSocioId: null,
          isSolicitudesEnabled: true,
          terminosVerificado: false,
        });
      },

      // Logout "suave" para vendors que quieren pasar a otra empresa: tira
      // todo lo que arrastraría una sesión anterior (formularios en curso,
      // empresa activa, verificación de términos) para que arranque como un
      // ingreso nuevo — pero sin tocar user/isAuthenticated, así no hace
      // falta reingresar credenciales. setLastActivity() (no clearLastActivity)
      // a propósito: reinicia el reloj de inactividad en vez de dejarlo sin
      // marca, ya que la sesión sigue autenticada.
      cambiarEmpresa: () => {
        limpiarStorageEfimero();
        setLastActivity();
        set({ activeSocioId: null, terminosVerificado: false });
      },
    }),
    {
      name: "auth-storage",
      // terminosVerificado no se persiste a propósito: un refresh duro
      // siempre vuelve a chequear contra el backend (2 GETs baratos) en vez
      // de confiar en un flag viejo guardado en localStorage.
      partialize: (state) => {
        const { terminosVerificado: _terminosVerificado, ...persistido } = state;
        return persistido;
      },
    },
  ),
);
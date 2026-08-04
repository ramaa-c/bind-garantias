import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setLastActivity, clearLastActivity } from "../utils/sessionActivity";

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

      setUser: (userData) => {
        if (!userData) {
          set({ user: null, isAuthenticated: false, activeSocioId: null, terminosVerificado: false });
          return;
        }

        const { hashseguridad, ...safeUser } = userData;

        // Marca el arranque del reloj de inactividad justo en el login -
        // así, cuando useSessionTimeout recalcule el tiempo restante (al
        // montar, al volver de background, o en otra pestaña), parte de "0
        // segundos transcurridos" y no de un timestamp viejo/inexistente.
        setLastActivity();

        set({
          user: safeUser,
          isAuthenticated: true,
          terminosVerificado: false,
        });
      },

      clearAuth: () => {
        clearLastActivity();
        if (typeof window !== "undefined") {
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
        }
        set({
          user: null,
          isAuthenticated: false,
          activeSocioId: null,
          isSolicitudesEnabled: true,
          terminosVerificado: false,
        });
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
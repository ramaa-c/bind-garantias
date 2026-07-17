import { create } from "zustand";
import { persist } from "zustand/middleware";

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

        set({
          user: safeUser,
          isAuthenticated: true,
          terminosVerificado: false,
        });
      },

      clearAuth: () => {
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
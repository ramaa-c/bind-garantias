import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeSocioId: null,

      setActiveSocioId: (socioId) => set({ activeSocioId: socioId }),

      setUser: (userData) => {
        if (!userData) {
          set({ user: null, isAuthenticated: false, activeSocioId: null });
          return;
        }

        const { hashseguridad, ...safeUser } = userData;

        set({
          user: safeUser,
          isAuthenticated: true,
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
        });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
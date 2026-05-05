import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (userData) => {
        if (!userData) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        const { hashseguridad, ...safeUser } = userData;

        set({
          user: safeUser,
          isAuthenticated: true,
        });
      },

      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    },
  ),
);

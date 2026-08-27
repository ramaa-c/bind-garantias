import { create } from "zustand";
import { persist } from "zustand/middleware";

// Preferencia de tema de la ZONA CLIENTE únicamente - el panel admin sigue
// siempre con su tema azul actual (ver ThemeManager, que no aplica esto en
// rutas /admin). Persiste en localStorage para que sobreviva un F5/reingreso.
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "bind-theme",
    },
  ),
);

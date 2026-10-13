import { create } from "zustand";
import { persist } from "zustand/middleware";

// Modo claro deshabilitado temporalmente para esta entrega (el retoque de
// legibilidad todavía no está terminado, ver conversación) - toggleTheme/
// setTheme quedan de no-op y merge() pisa cualquier "light" que haya
// quedado persistido en localStorage de pruebas anteriores, para que nadie
// entre en un estado a medio terminar. El botón en Navbar.jsx también se
// oculta detrás de este mismo flag. Para reactivarlo: LIGHT_MODE_ENABLED = true.
export const LIGHT_MODE_ENABLED = false;

// Preferencia de tema de la ZONA CLIENTE únicamente - el panel admin sigue
// siempre con su tema azul actual (ver ThemeManager, que no aplica esto en
// rutas /admin). Persiste en localStorage para que sobreviva un F5/reingreso.
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () =>
        LIGHT_MODE_ENABLED &&
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setTheme: (theme) => LIGHT_MODE_ENABLED && set({ theme }),
    }),
    {
      name: "bind-theme",
      merge: (persistedState, currentState) =>
        LIGHT_MODE_ENABLED
          ? { ...currentState, ...persistedState }
          : { ...currentState, ...persistedState, theme: "dark" },
    },
  ),
);

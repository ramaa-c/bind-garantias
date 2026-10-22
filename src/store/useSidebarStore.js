import { create } from "zustand";
import { persist } from "zustand/middleware";

// Preferencia del sidebar de escritorio de la zona cliente: expandido
// (por defecto) o compacto (rail de íconos). La comparten Sidebar.jsx (que
// cambia de ancho) y Navbar.jsx (que en modo compacto muestra la empresa
// activa, porque el sidebar ya no tiene lugar para ella). Persiste en
// localStorage para que sobreviva un F5/reingreso. En mobile no aplica:
// ahí el sidebar es siempre el drawer completo.
export const useSidebarStore = create(
  persist(
    (set, get) => ({
      compacto: false,
      toggleCompacto: () => set({ compacto: !get().compacto }),
    }),
    { name: "bind-sidebar" },
  ),
);

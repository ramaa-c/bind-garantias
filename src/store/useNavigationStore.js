import { create } from "zustand";

export const useNavigationStore = create((set) => ({
  hasUnsavedChanges: false,
  setUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
}));

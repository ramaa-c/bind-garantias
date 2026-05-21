import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";

export const AdminGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);

  // Verificamos si el usuario actual tiene rol de administrador o ingresó con las credenciales admin
  const isAdmin = user?.role === "admin" || user?.email === "admin";

  if (!isAdmin) {
    return <Navigate to="/ingresar" replace />;
  }

  // Renderizamos directamente los componentes de administración sin disparar llamadas API innecesarias
  // ni requerir validación de onboarding/empresas
  return <>{children}</>;
};

export default AdminGuard;

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAdminRestrictions } from "../../../hooks/useAdminRestrictions";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";
import { useChannel } from "../../../context/ChannelContext";

export const AdminGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { channelInfo } = useChannel();
  const channelSlug = channelInfo?.id || "default";

  // Verificamos si el usuario actual tiene rol de administrador o ingresó con las credenciales admin
  const isAdmin = user?.role === "admin" || user?.email === "admin";

  const { isRestricted, isPending } = useAdminRestrictions();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isPending) {
    return (
      <LoadingScreen
        title="Cargando acceso"
        message="Verificando permisos de administración..."
      />
    );
  }

  const isDashboardPage = location.pathname.endsWith("/admin/dashboard");

  if (isRestricted && !isDashboardPage) {
    return <Navigate to={`/${channelSlug}/admin/dashboard`} replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAdminRestrictions } from "../../../hooks/useAdminRestrictions";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";
import { useChannel } from "../../../context/ChannelContext";
import {
  useObtenerPorNombreOEmail,
  useObtenerCadenasPorUsuario,
} from "../../../hooks/useUsuario";

export const AdminGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { channelInfo } = useChannel();
  const channelSlug = channelInfo?.id || "default";

  const { data: usuarioDb, isPending: isUserLoading } =
    useObtenerPorNombreOEmail(user?.email || "");

  const parsearUsuarioWebId = (db) => {
    if (!db) return null;
    if (Array.isArray(db))
      return db[0]?.usuariowebid || db[0]?.UsuarioWebID || db[0]?.id;
    if (db.items)
      return (
        db.items[0]?.usuariowebid ||
        db.items[0]?.UsuarioWebID ||
        db.items[0]?.id
      );
    if (db.data)
      return (
        db.data[0]?.usuariowebid || db.data[0]?.UsuarioWebID || db.data[0]?.id
      );
    return db.usuariowebid || db.UsuarioWebID || db.id || null;
  };

  const usuarioWebId = parsearUsuarioWebId(usuarioDb);

  const { data: cadenasData, isPending: isCadenasLoading } =
    useObtenerCadenasPorUsuario(usuarioWebId);

  const hasCadenas = Array.isArray(cadenasData)
    ? cadenasData.length > 0
    : cadenasData?.items?.length > 0 || cadenasData?.data?.length > 0;
  const isAdminCadena = hasCadenas;

  const { isRestricted, isPending } = useAdminRestrictions();

  const isBasicAdmin =
    user?.role === "admin" ||
    user?.email === "admin";

  const isLoading =
    isPending || isUserLoading || (usuarioWebId && isCadenasLoading);

  if (isLoading) {
    return (
      <LoadingScreen
        title="Cargando acceso"
        message="Verificando permisos de administración..."
      />
    );
  }

  const isAdmin = isBasicAdmin || isAdminCadena;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isDashboardPage = location.pathname === "/admin/dashboard";

  if (isRestricted && !isDashboardPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;

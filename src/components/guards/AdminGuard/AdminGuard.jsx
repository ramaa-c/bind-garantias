import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAdminRestrictions } from "../../../hooks/useAdminRestrictions";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";
import {
  useObtenerPorNombreOEmail,
  useObtenerCadenasPorUsuario,
} from "../../../hooks/useUsuario";

const parsearRegistroUsuario = (db) => {
  if (!db) return null;
  if (Array.isArray(db)) return db[0] || null;
  if (db.items) return db.items[0] || null;
  if (db.data) return db.data[0] || null;
  return db;
};

const esAdministradorActivo = (registro) => {
  const valor = registro?.esadministrador ?? registro?.EsAdministrador;
  return valor === "1" || valor === 1 || valor === true;
};

export const AdminGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();

  const { data: usuarioDb, isPending: isUserLoading } =
    useObtenerPorNombreOEmail(user?.email || "");

  const registroUsuario = parsearRegistroUsuario(usuarioDb);
  const usuarioWebId =
    registroUsuario?.usuariowebid ??
    registroUsuario?.UsuarioWebID ??
    registroUsuario?.id ??
    null;
  const esAdministrador = esAdministradorActivo(registroUsuario);
  const denominacionReal =
    registroUsuario?.denominacion ?? registroUsuario?.Denominacion ?? "";

  // Corrige el nombre mostrado (userTrigger del navbar) en cuanto conocemos el
  // registro real: si no tiene denominación cargada, mostramos el email en
  // vez del placeholder "Administrador General" seteado al loguearse.
  useEffect(() => {
    if (!registroUsuario) return;
    const nombreResuelto = denominacionReal || user?.email || "";
    const necesitaNombre = !!nombreResuelto && nombreResuelto !== user?.nombre;
    const necesitaUsuarioWebId = !!usuarioWebId && usuarioWebId !== user?.usuarioWebId;
    if (necesitaNombre || necesitaUsuarioWebId) {
      setUser({
        ...user,
        ...(necesitaNombre ? { nombre: nombreResuelto } : {}),
        ...(necesitaUsuarioWebId ? { usuarioWebId } : {}),
      });
    }
  }, [registroUsuario, denominacionReal, usuarioWebId, user, setUser]);

  const { data: cadenasData, isPending: isCadenasLoading } =
    useObtenerCadenasPorUsuario(usuarioWebId);

  const hasCadenas = Array.isArray(cadenasData)
    ? cadenasData.length > 0
    : cadenasData?.items?.length > 0 || cadenasData?.data?.length > 0;
  const isAdminCadena = hasCadenas;

  const { isRestricted, isPending } = useAdminRestrictions();

  const isBasicAdmin = user?.role === "admin" || user?.email === "admin";
  const tieneSesion = !!user?.email;

  // Sin sesión, `useObtenerPorNombreOEmail` queda deshabilitado (email vacío)
  // y su query nunca sale de "pending" en react-query: sin este corte,
  // isLoading quedaría en true para siempre y el guard jamás redirige.
  if (!tieneSesion) {
    return <Navigate to="/login" replace />;
  }

  const isLoading =
    !isBasicAdmin &&
    (isPending || isUserLoading || (usuarioWebId && isCadenasLoading));

  if (isLoading) {
    return (
      <LoadingScreen
        title="Cargando acceso"
        message="Verificando permisos de administración..."
      />
    );
  }

  const isAdmin = isBasicAdmin || esAdministrador || isAdminCadena;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isDashboardPage = location.pathname === "/admin";

  if (isRestricted && !isDashboardPage) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;

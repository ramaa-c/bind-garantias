import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useObtenerSocioUsuarioPorUsuarioId } from "../../../hooks/useSocios";
import { useObtenerPorNombreOEmail } from "../../../hooks/useUsuario";
import Spinner from "../../ui/Spinner/Spinner";

export const OnboardingGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const isTerminosPage = location.pathname === "/terminos";
  const isAltaDatosPage = location.pathname === "/alta-datos-empresa";

  if (!user || !user.email) {
    return <Navigate to="/ingresar" replace />;
  }

  const { data: usuarioDb, isPending: isLoadingUser } =
    useObtenerPorNombreOEmail(user.email);

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

  const { data: socioUsuarios, isPending: isPendingSocios } =
    useObtenerSocioUsuarioPorUsuarioId(usuarioWebId || 0);

  const parsearEmpresas = (sociosData) => {
    if (!sociosData) return [];
    if (Array.isArray(sociosData)) return sociosData;
    if (sociosData.items) return sociosData.items;
    if (sociosData.data) return sociosData.data;
    if (typeof sociosData === "object" && Object.keys(sociosData).length > 0)
      return [sociosData];
    return [];
  };

  const listaEmpresas = parsearEmpresas(socioUsuarios);
  const tieneEmpresas = listaEmpresas.length > 0;

  if ((isLoadingUser && !usuarioWebId) || (usuarioWebId && isPendingSocios)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--color-background, #121212)",
        }}
      >
        <Spinner />
      </div>
    );
  }

  if (usuarioWebId && tieneEmpresas) {
    if (isTerminosPage || isAltaDatosPage) {
      return <Navigate to="/inicio" replace />;
    }
  } else if (usuarioWebId && !tieneEmpresas) {
    if (!isTerminosPage && !isAltaDatosPage) {
      return <Navigate to="/terminos" replace />;
    }
  }

  return <>{children}</>;
};

export default OnboardingGuard;

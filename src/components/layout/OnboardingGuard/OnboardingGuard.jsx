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

  const usuarioWebId =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id || null;

  const {
    data: socioUsuarios,
    isPending: isPendingSocios,
    isFetching: isFetchingSocios,
    isError,
  } = useObtenerSocioUsuarioPorUsuarioId(usuarioWebId);

  if (isTerminosPage || isAltaDatosPage) {
    return <>{children}</>;
  }

  if (isLoadingUser || !usuarioWebId || isPendingSocios || isFetchingSocios) {
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

  const tieneEmpresas =
    Array.isArray(socioUsuarios) && socioUsuarios.length > 0;

  if (isError || !tieneEmpresas) {
    return <Navigate to="/terminos" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;

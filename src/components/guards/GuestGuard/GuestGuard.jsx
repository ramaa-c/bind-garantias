import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/ChannelContext";

// Evita que un usuario ya logueado vea login/registro/recuperar-clave -
// análogo cliente del useEffect que ya hace LoginAdmin.jsx para admin
// (`user?.role === "admin" → navigate("/admin")`). Acá se armó como guard
// reusable en vez de repetir el mismo chequeo en cada página porque del lado
// cliente son varias pantallas (no una sola como en admin).
//
// Es un atajo de UX nomás, no una revalidación de sesión: si el usuario
// termina en /legajo con un rol/estado que no corresponde, OnboardingGuard
// ya se encarga de sacarlo de ahí (mismo principio que AdminGuard revalida
// después del atajo de LoginAdmin).
export const GuestGuard = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { channelInfo } = useChannel();

  if (isAuthenticated) {
    return <Navigate to={`/${channelInfo.id}/legajo`} replace />;
  }

  return <>{children}</>;
};

export default GuestGuard;

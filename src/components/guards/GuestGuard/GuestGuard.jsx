import React, { useEffect } from "react";
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
  const activeSocioId = useAuthStore((state) => state.activeSocioId);
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);
  const { basePath } = useChannel();

  // Volver a /login con una sesión que nunca se cerró (activeSocioId de la
  // última empresa usada todavía en el store) no debe reanudar en
  // silencio esa elección - se lo trata igual que "Cambiar empresa" (mismo
  // cambiarEmpresa(), ver useAuthStore) para que OnboardingGuard, al
  // evaluar de nuevo ya con activeSocioId limpio, mande a un vendor al
  // selector en vez de arrastrar la elección de la sesión anterior. Se
  // resuelve acá (no eligiendo destino nosotros mismos) para no duplicar la
  // decisión de a dónde mandar a cada rol - esa autoridad es de
  // OnboardingGuard.
  useEffect(() => {
    if (isAuthenticated && activeSocioId) {
      cambiarEmpresa();
    }
  }, [isAuthenticated, activeSocioId, cambiarEmpresa]);

  if (isAuthenticated && activeSocioId) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={`${basePath}/legajo`} replace />;
  }

  return <>{children}</>;
};

export default GuestGuard;

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/useChannel";
import { useAdminRestrictions } from "../../../hooks/useAdminRestrictions";
import { useSessionTimeout } from "../../../hooks/useSessionTimeout";
import { ConfirmacionModal } from "../../features/shared/ConfirmacionModal/ConfirmacionModal";
import { SessionExpiryNotice } from "./SessionExpiryNotice";
import { borrarTokenApi, obtenerVencimientoTokenMs } from "../../../api/tokenApi";
import { queryClient } from "../../../api/queryClient";

// Estándar de industria (OWASP ASVS) para apps autenticadas de riesgo medio:
// 15-30 min de inactividad. 20 min + aviso 1 min antes, igual en admin y en
// cliente (mismo useAuthStore para ambos).
const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const WARNING_MS = 60 * 1000;

// Fuera de TenantLayout, useChannel().id siempre vale "default" (ver
// ChannelContext) - no sirve para reconstruir el login del cliente. En modo
// legacy el slug real se saca directo de la URL, igual que hace cada guard;
// en modo por host no hay slug en el path y el login del cliente es
// directamente "/login" (ver utils/tenantConfig.js).
//
// Un UsuarioCadenaValor (admin restringido a su/s cadena/s) entró por el
// login de cliente de su banco, no por el de admin — si el timeout lo agarra
// en /admin/*, tiene que volver ahí, no al login de Administrador General
// (mismo criterio que AdminNavbar.jsx → handleLogout). En modo-por-host
// "/login" ya es el correcto sin hacer nada más.
const resolverLoginPath = (pathname, modoPorHost, isRestricted, cadenas) => {
  if (modoPorHost) return "/login";
  if (pathname === "/login" || pathname.startsWith("/admin")) {
    if (isRestricted && cadenas?.length > 0) {
      const cadenaId = cadenas[0]?.cadenavalorid ?? cadenas[0]?.CadenaValorID;
      if (cadenaId) return `/${cadenaId}/login`;
    }
    return "/login";
  }
  const cadenaSlug = pathname.split("/")[1];
  return cadenaSlug ? `/${cadenaSlug}/login` : "/login";
};

const CLAVE_AVISO_CAMBIO_CUENTA = "avisoCambioCuentaOtraPestana";

const leerEstadoPersistido = (valor) => {
  try {
    return JSON.parse(valor)?.state ?? null;
  } catch {
    return null;
  }
};

const normalizarEmail = (usuario) => usuario?.email?.trim().toLowerCase() || null;

const marcarAvisoCambioCuenta = () => {
  try {
    sessionStorage.setItem(CLAVE_AVISO_CAMBIO_CUENTA, "1");
  } catch {
    return;
  }
};

const consumirAvisoCambioCuenta = () => {
  try {
    const hayAviso = sessionStorage.getItem(CLAVE_AVISO_CAMBIO_CUENTA) === "1";
    sessionStorage.removeItem(CLAVE_AVISO_CAMBIO_CUENTA);
    return hayAviso;
  } catch {
    return false;
  }
};

export const SessionTimeoutManager = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const usuarioLogueado = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const { modoPorHost } = useChannel();
  const { isRestricted, cadenas } = useAdminRestrictions();

  const handleTimeout = () => {
    clearAuth();
    toast.info("Tu sesión se cerró por inactividad.");
    navigate(resolverLoginPath(location.pathname, modoPorHost, isRestricted, cadenas), { replace: true });
  };

  const handleVencimientoToken = () => {
    borrarTokenApi();
    clearAuth();
    toast.info("Tu sesión venció. Volvé a ingresar para continuar.");
    navigate(resolverLoginPath(location.pathname, modoPorHost, isRestricted, cadenas), { replace: true });
  };

  useEffect(() => {
    if (consumirAvisoCambioCuenta()) {
      toast.info("Se inició sesión con otra cuenta en otra pestaña.", {
        description: "Esta pestaña se actualizó con esa sesión.",
      });
    }
  }, []);

  const handleVencimientoTokenRef = useRef(handleVencimientoToken);
  useEffect(() => {
    handleVencimientoTokenRef.current = handleVencimientoToken;
  });

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const vencimientoMs = obtenerVencimientoTokenMs();
    if (!vencimientoMs) return undefined;
    const temporizador = setTimeout(
      () => handleVencimientoTokenRef.current(),
      Math.max(vencimientoMs - Date.now(), 0),
    );
    return () => clearTimeout(temporizador);
  }, [isAuthenticated, usuarioLogueado]);

  const { showWarning, secondsLeft, extenderSesion } = useSessionTimeout({
    enabled: isAuthenticated,
    idleMs: IDLE_TIMEOUT_MS,
    warningMs: WARNING_MS,
    onTimeout: handleTimeout,
  });

  // Sincroniza el cierre de sesión entre pestañas: si se cierra sesión en
  // otra pestaña del mismo origen (manual, o por este mismo timeout corriendo
  // ahí), zustand persist ya escribió el nuevo estado en localStorage bajo la
  // key "auth-storage" - pero por defecto el store de ESTA pestaña no se
  // entera solo (persist no re-hidrata automáticamente entre pestañas).
  useEffect(() => {
    const handleAuthStorage = (e) => {
      if (e.key !== "auth-storage") return;
      const estadoActual = useAuthStore.getState();

      if (!estadoActual.isAuthenticated) {
        useAuthStore.persist.rehydrate();
        return;
      }

      const estadoNuevo = leerEstadoPersistido(e.newValue);

      if (!estadoNuevo?.isAuthenticated) {
        useAuthStore.persist.rehydrate();
        toast.info("Tu sesión se cerró en otra pestaña.");
        navigate(resolverLoginPath(location.pathname, modoPorHost, isRestricted, cadenas), { replace: true });
        return;
      }

      if (normalizarEmail(estadoNuevo.user) !== normalizarEmail(estadoActual.user)) {
        marcarAvisoCambioCuenta();
        queryClient.clear();
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleAuthStorage);
    return () => window.removeEventListener("storage", handleAuthStorage);
  }, [navigate, location.pathname, modoPorHost, isRestricted, cadenas]);

  const esAdmin =
    location.pathname.startsWith("/admin") || location.pathname === "/login";

  return (
    <ConfirmacionModal
      isOpen={isAuthenticated && showWarning}
      onClose={handleTimeout}
      onConfirm={extenderSesion}
      preventClose
      variant={esAdmin ? "blue" : "default"}
      // tone="warning" (ámbar) en vez de "danger" (rojo) - todavía no es una
      // situación crítica, es un aviso preventivo; el rojo queda reservado
      // para acciones destructivas reales. Los botones se pisan explícito
      // abajo para no invertir la jerarquía: "Seguir conectado" (la opción
      // segura) debe quedar destacado, y "Cerrar sesión" como el outline
      // neutro de siempre.
      tone="warning"
      confirmVariant={esAdmin ? "blue" : "primary"}
      cancelVariant={esAdmin ? "outlineBlue" : "outline"}
      titulo="¿Seguís ahí?"
      mensaje={
        <SessionExpiryNotice
          secondsLeft={secondsLeft}
          totalSeconds={Math.ceil(WARNING_MS / 1000)}
        />
      }
      confirmText="Seguir conectado"
      cancelText="Cerrar sesión"
      maxWidth="440px"
    />
  );
};

export default SessionTimeoutManager;

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/useChannel";
import { useAdminRestrictions } from "../../../hooks/useAdminRestrictions";
import { useSessionTimeout } from "../../../hooks/useSessionTimeout";
import { ConfirmacionModal } from "../../features/shared/ConfirmacionModal/ConfirmacionModal";
import { SessionExpiryNotice } from "./SessionExpiryNotice";
import { borrarTokenApi, obtenerDatosTokenApi, CLAVE_STORAGE_TOKEN } from "../../../api/tokenApi";
import {
  renovarTokenApi,
  RENOVACION_OK,
  RENOVACION_EN_CURSO,
  RENOVACION_RECHAZADA,
} from "../../../api/renovacionToken";
import { getLastActivity } from "../../../utils/sessionActivity";
import { queryClient } from "../../../api/queryClient";

// Estándar de industria (OWASP ASVS) para apps autenticadas de riesgo medio:
// 15-30 min de inactividad. 20 min + aviso 1 min antes, igual en admin y en
// cliente (mismo useAuthStore para ambos).
const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const ANTICIPO_RENOVACION_MS = 10 * 60 * 1000;
const REINTENTO_RENOVACION_MS = 60 * 1000;
const ESPERA_OTRA_PESTANA_MS = 5 * 1000;
const SESION_MAXIMA_MS = 12 * 60 * 60 * 1000;
const AVISO_SESION_MAXIMA_MS = 5 * 60 * 1000;

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

  const handleVencimientoToken = (mensaje = "Tu sesión venció. Volvé a ingresar para continuar.") => {
    borrarTokenApi();
    clearAuth();
    toast.info(mensaje);
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
    let temporizador = null;
    let activo = true;

    const programar = (demoraMs) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(intentarRenovar, Math.max(demoraMs, 0));
    };

    const programarSegunToken = () => {
      const datos = obtenerDatosTokenApi();
      if (!datos?.vencimientoMs) return;
      programar(datos.vencimientoMs - ANTICIPO_RENOVACION_MS - Date.now());
    };

    async function intentarRenovar() {
      const datos = obtenerDatosTokenApi();
      if (!datos?.vencimientoMs) return;
      const restanteMs = datos.vencimientoMs - Date.now();
      if (restanteMs > ANTICIPO_RENOVACION_MS + 1000) {
        programarSegunToken();
        return;
      }
      const ultimaActividad = getLastActivity();
      const huboActividad = !!ultimaActividad && (!datos.emitidoMs || ultimaActividad >= datos.emitidoMs);
      if (!huboActividad) {
        if (restanteMs > REINTENTO_RENOVACION_MS) programar(REINTENTO_RENOVACION_MS);
        return;
      }
      const resultado = await renovarTokenApi();
      if (!activo) return;
      if (resultado === RENOVACION_OK) {
        programarSegunToken();
      } else if (resultado === RENOVACION_RECHAZADA) {
        handleVencimientoTokenRef.current();
      } else if (resultado === RENOVACION_EN_CURSO) {
        programar(ESPERA_OTRA_PESTANA_MS);
      } else if (restanteMs > ESPERA_OTRA_PESTANA_MS) {
        programar(Math.min(REINTENTO_RENOVACION_MS, restanteMs - ESPERA_OTRA_PESTANA_MS));
      }
    }

    const handleCambioToken = (e) => {
      if (e.key === CLAVE_STORAGE_TOKEN && e.newValue) programarSegunToken();
    };

    programarSegunToken();
    window.addEventListener("storage", handleCambioToken);
    return () => {
      activo = false;
      clearTimeout(temporizador);
      window.removeEventListener("storage", handleCambioToken);
    };
  }, [isAuthenticated, usuarioLogueado]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const inicioSesionMs = obtenerDatosTokenApi()?.inicioSesionMs;
    if (!inicioSesionMs) return undefined;
    const finSesionMs = inicioSesionMs + SESION_MAXIMA_MS;
    const ahora = Date.now();
    const aviso = setTimeout(() => {
      toast.warning("Tu sesión llega a su máximo en unos minutos", {
        id: "sesion-maxima",
        description: "Guardá tu trabajo: después vas a tener que volver a ingresar.",
        duration: AVISO_SESION_MAXIMA_MS,
      });
    }, Math.max(finSesionMs - AVISO_SESION_MAXIMA_MS - ahora, 0));
    const cierre = setTimeout(
      () => handleVencimientoTokenRef.current("Tu sesión llegó a su máximo de 12 horas. Volvé a ingresar para continuar."),
      Math.max(finSesionMs - ahora, 0),
    );
    return () => {
      clearTimeout(aviso);
      clearTimeout(cierre);
    };
  }, [isAuthenticated, usuarioLogueado]);


  const { showWarning, secondsLeft, extenderSesion } = useSessionTimeout({
    enabled: isAuthenticated,
    idleMs: IDLE_TIMEOUT_MS,
    warningMs: WARNING_MS,
    onTimeout: handleTimeout,
  });

  const seguirConectado = async () => {
    extenderSesion();
    const resultado = await renovarTokenApi();
    if (resultado === RENOVACION_RECHAZADA) handleVencimientoTokenRef.current();
  };

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
      onConfirm={seguirConectado}
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

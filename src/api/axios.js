import axios from "axios";
import { toast } from "sonner";
import { queryClient } from "./queryClient";
import { obtenerUltimoStatus, esOffline } from "../utils/statusPlataforma";
import {
  obtenerTokenApi,
  borrarTokenApi,
  esperarFinRenovacion,
  esRenovacionDeLaMismaSesion,
  hayRenovacionEnCurso,
} from "./tokenApi";
import { CABECERAS_BASE_API } from "./cabecerasApi";
import { useAuthStore } from "../store/useAuthStore";
import { esMensajeUtil } from "../utils/mensajesError";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: { ...CABECERAS_BASE_API },
});

// ─────────────────────────────────────────────────────────────
// Gate de "modo offline": si la plataforma cliente está fuera de
// servicio, cortamos acá CUALQUIER request que dispare una pantalla
// cliente (alta de legajo, solicitudes, carga de documentación, etc.)
// en vez de dejar que llegue al backend. El panel admin queda afuera
// a propósito: tiene que poder seguir operando para reactivarla.
//
// El estado se lee de la caché de react-query que ya mantiene
// actualizada `useObtenerStatusPlataforma` (poll cada 30s desde
// TenantLayout), así evitamos un segundo poller independiente y no
// hace falta tocar ningún service/hook existente.
// ─────────────────────────────────────────────────────────────

const esRutaAdmin = () => {
  const path = window.location.pathname;
  return path.startsWith("/admin") || path === "/login";
};

let yaRedirigiendo = false;

const redirigirAFueraDeServicio = () => {
  if (yaRedirigiendo || window.location.pathname === "/fuera-de-servicio") return;
  yaRedirigiendo = true;
  toast.error("La plataforma está en mantenimiento", {
    description: "Te vamos a redirigir a la pantalla de estado.",
  });
  setTimeout(() => window.location.assign("/fuera-de-servicio"), 900);
};

// Sin token, la API responde 401 "Authorization Required" a todo lo que no
// es público (lo público va con sinToken): se corta acá para no llenar el
// log del backend, típicamente con las consultas que se refrescan justo
// después de cerrar sesión o de que venció el token en otra pestaña.
const agregarTokenApi = async (config) => {
  if (config.sinToken) return config;
  let token = obtenerTokenApi();
  if (!token && hayRenovacionEnCurso()) {
    await esperarFinRenovacion();
    token = obtenerTokenApi();
  }
  if (!token) {
    const error = new Error("No hay una sesión activa");
    error.isSinSesion = true;
    error.config = config;
    throw error;
  }
  config.__conToken = true;
  config.__tokenUsado = token;
  config.headers.Authorization = `Bearer ${token}`;
  return config;
};

const esConsultaDeEstado = (url = "") =>
  url.includes("StatusPlataforma") || url.includes("PlataformaOnline");

api.interceptors.request.use(async (config) => {
  // El propio chequeo de estado nunca se bloquea a sí mismo.
  if (esConsultaDeEstado(config.url) || esRutaAdmin()) {
    return agregarTokenApi(config);
  }

  const statusCacheado = queryClient.getQueryData(["plataformaOnline"]);
  if (esOffline(obtenerUltimoStatus(statusCacheado))) {
    const error = new Error("La plataforma cliente está en mantenimiento");
    error.isPlataformaOffline = true;
    return Promise.reject(error);
  }

  return agregarTokenApi(config);
});

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Firma típica de FireDAC/Delphi cuando el pool de conexiones a BD del backend
// se agotó. En ese caso NO conviene reintentar automáticamente: el backend ya
// está saturado y un reintento inmediato solo suma presión al pool. Distinto
// es el caso de "backend dormido" (timeout/error de red), donde sí queremos
// reintentar porque la primera request suele fallar mientras el servicio arranca.
const POOL_EXHAUSTION_PATTERN = /FireDAC|Cannot acquire item/i;

const isPoolExhaustionError = (error) => {
  const data = error.response?.data;
  if (!data) return false;
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return POOL_EXHAUSTION_PATTERN.test(text);
};

const RUTAS_CON_401_DE_NEGOCIO = [
  /auth\/login/i,
  /auth\/refresh/i,
  /usuario\/(?:[^/]+\/)?(?:login|password)/i,
  /usuario\/notificar/i,
  /Socio\/ValidarCuit/i,
  /Socio\/CertificadoVigente/i,
  /CadenaValor\/Libradores\/[^/?]+\/[^/?]+/i,
  /CadenaValor\/Relaciones\/[^/?]+\/[^/?]+/i,
];

const esSesionVencida = (error) => {
  const config = error.config;
  if (error.response?.status !== 401 || config?.sinToken) return false;
  const url = config?.url || "";
  if (RUTAS_CON_401_DE_NEGOCIO.some((ruta) => ruta.test(url))) return false;
  return Boolean(config?.__conToken) || useAuthStore.getState().isAuthenticated;
};

const reintentarConTokenRenovado = async (config) => {
  if (!config.__tokenUsado || config.__reintentoPorRenovacion) return false;
  await esperarFinRenovacion();
  const tokenActual = obtenerTokenApi();
  if (!tokenActual || tokenActual === config.__tokenUsado) return false;
  if (!esRenovacionDeLaMismaSesion(config.__tokenUsado, tokenActual)) return false;
  config.__reintentoPorRenovacion = true;
  return true;
};

const RUTAS_CON_LIMITE_POR_CUIT =
  /(api\/(nosis|afip|lufe|Socio\/(ValidarCuit|CertificadoVigente|DisponibilidadCuit)|TerceroRelacionado)|sgrplus\/Socio\/ValidarVinculo)\b/i;

const esLimiteDeConsultasPorCuit = (error) =>
  error.response?.status === 429 &&
  RUTAS_CON_LIMITE_POR_CUIT.test(error.config?.url || "");

const rutaDeLogin = () => {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "/login";
  const primerSegmento = path.split("/")[1];
  return /^\d+$/.test(primerSegmento) ? `/${primerSegmento}/login` : "/login";
};

let cerrandoSesion = false;

export const cerrarSesionLocal = ({
  titulo = "Tu sesión venció",
  descripcion = "Volvé a ingresar para continuar.",
  tipo = "error",
} = {}) => {
  if (cerrandoSesion) return;
  cerrandoSesion = true;
  borrarTokenApi();
  useAuthStore.getState().clearAuth();
  queryClient.clear();
  toast[tipo](titulo, { description: descripcion });
  setTimeout(() => window.location.assign(rutaDeLogin()), 900);
};

const transformKeysToLowercase = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToLowercase(item));
  }

  // Handle FormData, Blob, File, etc.
  if (obj instanceof FormData || obj instanceof Blob || obj instanceof File) {
    return obj;
  }

  const camelObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      camelObj[lowerKey] = transformKeysToLowercase(obj[key]);
    }
  }
  return camelObj;
};

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformKeysToLowercase(response.data);
    }
    return response;
  },
  async (error) => {
    if (error?.isPlataformaOffline) {
      redirigirAFueraDeServicio();
      return Promise.reject(error);
    }

    if (error?.isSinSesion) {
      if (useAuthStore.getState().isAuthenticated) cerrarSesionLocal();
      return Promise.reject(error);
    }

    const config = error.config;

    if (!config) return Promise.reject(error);

    if (esSesionVencida(error)) {
      if (await reintentarConTokenRenovado(config)) return api(config);
      cerrarSesionLocal();
      return Promise.reject(error);
    }

    if (esLimiteDeConsultasPorCuit(error)) {
      toast.error("Demasiados pedidos", {
        id: "limite-consultas-cuit",
        description:
          "Alcanzaste el límite de consultas de datos por CUIT. Intentá nuevamente más tarde.",
      });
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;
    // Solo lecturas: un POST/PUT que respondió 5xx (o se cortó) puede haberse
    // aplicado igual, y reintentarlo duplica altas en la API.
    const esLectura = (config.method || "get").toLowerCase() === "get";
    const isSafeToRetry =
      esLectura && (isNetworkError || isServerError) && !isPoolExhaustionError(error);

    if (isSafeToRetry && !config.noRetry && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;

      const delay = RETRY_DELAY_MS * config.__retryCount;

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    // Si ya no se reintenta y hubo un error de red en métodos de escritura
    if (isNetworkError && !config.silencioso) {
      const method = config.method?.toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        toast.error("Error de red. Verifica tu conexión e intenta nuevamente.");
      }
    }

    // Rechazos de negocio de la API (400, 403, 409, 429): el cuerpo es
    // { statusCode, message } con el motivo. Se deja ese motivo como
    // error.message para que cualquier pantalla que muestre err.message
    // (o utils/mensajesError) lo vea, en vez de "Request failed with status
    // code 409".
    const statusRechazo = error.response?.status;
    if ([400, 403, 409, 429].includes(statusRechazo)) {
      const cuerpo = error.response?.data;
      const motivo = typeof cuerpo === "string" ? cuerpo : cuerpo?.message;
      if (esMensajeUtil(motivo)) {
        error.message = motivo;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

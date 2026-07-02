import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
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
    const config = error.config;

    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount || 0;

    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;
    const isSafeToRetry =
      (isNetworkError || isServerError) && !isPoolExhaustionError(error);

    if (isSafeToRetry && !config.noRetry && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;

      const delay = RETRY_DELAY_MS * config.__retryCount;

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    // Si ya no se reintenta y hubo un error de red en métodos de escritura
    if (isNetworkError) {
      const method = config.method?.toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        toast.error("Error de red. Verifica tu conexión e intenta nuevamente.");
      }
    }

    return Promise.reject(error);
  },
);

export default api;

import api from "./axios";
import {
  guardarTokenApi,
  obtenerTokenApi,
  hayRenovacionEnCurso,
  CLAVE_CANDADO_RENOVACION as CLAVE_CANDADO,
} from "./tokenApi";

export const RENOVACION_OK = "ok";
export const RENOVACION_EN_CURSO = "en_curso";
export const RENOVACION_RECHAZADA = "rechazada";
export const RENOVACION_REINTENTAR = "reintentar";

const NOMBRE_LOCK = "bind-renovacion-token";

const marcarCandado = () => {
  try {
    localStorage.setItem(CLAVE_CANDADO, String(Date.now()));
  } catch {
    return;
  }
};

const soltarCandado = () => {
  try {
    localStorage.removeItem(CLAVE_CANDADO);
  } catch {
    return;
  }
};

const renovar = async (tokenAnterior) => {
  if (obtenerTokenApi() !== tokenAnterior) return RENOVACION_OK;
  marcarCandado();
  try {
    const { data } = await api.post("api/auth/refresh", null, { noRetry: true, silencioso: true });
    if (!data?.token) return RENOVACION_REINTENTAR;
    guardarTokenApi(data.token);
    return RENOVACION_OK;
  } catch (error) {
    if (error.response?.status !== 401) return RENOVACION_REINTENTAR;
    const tokenActual = obtenerTokenApi();
    return tokenActual && tokenActual !== tokenAnterior ? RENOVACION_OK : RENOVACION_RECHAZADA;
  } finally {
    soltarCandado();
  }
};

// Mismo lock que la renovación: si varias pestañas vencen a la vez, se cierran
// de a una y solo la primera encuentra el token para llamar a logout.
export const conCandadoDeSesion = (accion) => {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(NOMBRE_LOCK, accion);
  }
  return accion();
};

// Una sola pestaña renueva a la vez: dos refresh simultáneos con el mismo
// token hacen que la API intente dar de baja dos veces el anterior. El lock
// del navegador es atómico entre pestañas; el candado de localStorage queda
// como aviso para el interceptor (ver esperarFinRenovacion) y como respaldo
// en navegadores sin navigator.locks.
export const renovarTokenApi = async () => {
  const tokenAnterior = obtenerTokenApi();
  if (!tokenAnterior) return RENOVACION_RECHAZADA;
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(NOMBRE_LOCK, { ifAvailable: true }, (lock) =>
      lock ? renovar(tokenAnterior) : RENOVACION_EN_CURSO,
    );
  }
  if (hayRenovacionEnCurso()) return RENOVACION_EN_CURSO;
  return renovar(tokenAnterior);
};

import api from "./axios";
import { guardarTokenApi, obtenerTokenApi } from "./tokenApi";

const CLAVE_CANDADO = "tokenApiRenovando";
const VIGENCIA_CANDADO_MS = 15 * 1000;

export const RENOVACION_OK = "ok";
export const RENOVACION_EN_CURSO = "en_curso";
export const RENOVACION_RECHAZADA = "rechazada";
export const RENOVACION_REINTENTAR = "reintentar";

const tomarCandado = () => {
  try {
    const ocupadoDesde = Number(localStorage.getItem(CLAVE_CANDADO)) || 0;
    if (ocupadoDesde && Date.now() - ocupadoDesde < VIGENCIA_CANDADO_MS) return false;
    localStorage.setItem(CLAVE_CANDADO, String(Date.now()));
    return true;
  } catch {
    return true;
  }
};

const soltarCandado = () => {
  try {
    localStorage.removeItem(CLAVE_CANDADO);
  } catch {
    return;
  }
};

export const renovarTokenApi = async () => {
  const tokenAnterior = obtenerTokenApi();
  if (!tokenAnterior) return RENOVACION_RECHAZADA;
  if (!tomarCandado()) return RENOVACION_EN_CURSO;
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

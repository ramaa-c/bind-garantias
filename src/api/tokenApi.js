import { CABECERAS_BASE_API } from "./cabecerasApi";

export const CLAVE_STORAGE_TOKEN = "tokenApi";
export const CLAVE_CANDADO_RENOVACION = "tokenApiRenovando";
const VIGENCIA_CANDADO_RENOVACION_MS = 15 * 1000;
const CLAVE_STORAGE = CLAVE_STORAGE_TOKEN;
const CLAVE_GUARDADO_EN = "tokenApiGuardadoEn";
const INTERVALO_ESPERA_RENOVACION_MS = 250;

export const hayRenovacionEnCurso = () => {
  try {
    const ocupadoDesde = Number(localStorage.getItem(CLAVE_CANDADO_RENOVACION)) || 0;
    return !!ocupadoDesde && Date.now() - ocupadoDesde < VIGENCIA_CANDADO_RENOVACION_MS;
  } catch {
    return false;
  }
};

export const esperarFinRenovacion = async (maximoMs = 5000) => {
  const limite = Date.now() + maximoMs;
  while (hayRenovacionEnCurso() && Date.now() < limite) {
    await new Promise((resolve) => setTimeout(resolve, INTERVALO_ESPERA_RENOVACION_MS));
  }
};

const leerPayload = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const estaVencido = (token) => {
  const payload = leerPayload(token);
  return Boolean(payload?.exp) && Date.now() >= payload.exp * 1000;
};

export const esRenovacionDeLaMismaSesion = (tokenAnterior, tokenNuevo) => {
  const anterior = leerPayload(tokenAnterior);
  const nuevo = leerPayload(tokenNuevo);
  if (!anterior?.uid || !anterior?.sat || !nuevo) return false;
  return String(anterior.uid) === String(nuevo.uid) && anterior.sat === nuevo.sat;
};

export const guardarTokenApi = (token) => {
  try {
    localStorage.setItem(CLAVE_STORAGE, token);
    localStorage.setItem(CLAVE_GUARDADO_EN, String(Date.now()));
  } catch {
    return;
  }
};

export const borrarTokenApi = () => {
  try {
    localStorage.removeItem(CLAVE_STORAGE);
    localStorage.removeItem(CLAVE_GUARDADO_EN);
  } catch {
    return;
  }
};

export const obtenerTokenApi = () => {
  let token = null;
  try {
    token = localStorage.getItem(CLAVE_STORAGE);
  } catch {
    return null;
  }
  if (!token) return null;
  if (estaVencido(token)) {
    borrarTokenApi();
    return null;
  }
  return token;
};

export const obtenerVencimientoTokenMs = () => {
  const token = obtenerTokenApi();
  const payload = token ? leerPayload(token) : null;
  return payload?.exp ? payload.exp * 1000 : null;
};

export const obtenerDatosTokenApi = () => {
  const token = obtenerTokenApi();
  const payload = token ? leerPayload(token) : null;
  if (!payload) return null;
  let guardadoEn = null;
  try {
    guardadoEn = Number(localStorage.getItem(CLAVE_GUARDADO_EN)) || null;
  } catch {
    guardadoEn = null;
  }
  return {
    token,
    vencimientoMs: payload.exp ? payload.exp * 1000 : null,
    emitidoMs: payload.iat ? payload.iat * 1000 : guardadoEn,
    inicioSesionMs: payload.sat ? payload.sat * 1000 : null,
    usuarioWebId: payload.uid ?? null,
    roles: String(payload.roles ?? "").split(/[;,]/).map((r) => r.trim()).filter(Boolean),
  };
};

export const esAdminGeneralToken = () => (obtenerDatosTokenApi()?.roles || []).includes("Admin");

export const cerrarSesionApi = () => {
  const token = obtenerTokenApi();
  borrarTokenApi();
  if (!token) return;
  try {
    // VITE_API_URL puede venir con o sin barra final ("/proxy-backend" en los ambientes con IIS): se normaliza
    const base = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
    fetch(`${base}/api/auth/logout`, {
      method: "POST",
      keepalive: true,
      headers: { ...CABECERAS_BASE_API, Authorization: `Bearer ${token}` },
    }).catch(() => {});
  } catch {
    return;
  }
};

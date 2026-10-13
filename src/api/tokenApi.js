import { CABECERAS_BASE_API } from "./cabecerasApi";

const CLAVE_STORAGE = "tokenApi";

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

export const guardarTokenApi = (token) => {
  try {
    localStorage.setItem(CLAVE_STORAGE, token);
  } catch {
    return;
  }
};

export const borrarTokenApi = () => {
  try {
    localStorage.removeItem(CLAVE_STORAGE);
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

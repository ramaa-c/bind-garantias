import axios from "axios";
import { obtenerCredencialesApi } from "./credencialesApi";

const MARGEN_RENOVACION_MS = 60 * 1000;
const DURACION_POR_DEFECTO_MS = 50 * 60 * 1000;

let tokenActual = null;
let vencimientoMs = 0;
let solicitudEnCurso = null;

const leerPayload = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

const calcularDuracionMs = (token) => {
  const payload = leerPayload(token);
  if (payload?.exp && payload?.iat && payload.exp > payload.iat) {
    return (payload.exp - payload.iat) * 1000;
  }
  return DURACION_POR_DEFECTO_MS;
};

const solicitarToken = async () => {
  const { usuario, clave } = obtenerCredencialesApi();
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_URL}api/auth/login`,
    null,
    {
      timeout: 30000,
      headers: {
        Accept: "application/json",
        jwtusername: usuario,
        jwtpassword: clave,
      },
    },
  );

  const token = data?.token ?? data?.Token;
  if (!token) {
    throw new Error("La API no devolvió un token de acceso");
  }

  tokenActual = token;
  vencimientoMs = Date.now() + calcularDuracionMs(token);
  return token;
};

export const obtenerTokenApi = () => {
  if (tokenActual && Date.now() < vencimientoMs - MARGEN_RENOVACION_MS) {
    return Promise.resolve(tokenActual);
  }

  if (!solicitudEnCurso) {
    solicitudEnCurso = solicitarToken().finally(() => {
      solicitudEnCurso = null;
    });
  }

  return solicitudEnCurso;
};

export const invalidarTokenApi = (tokenRechazado) => {
  if (tokenRechazado && tokenRechazado !== tokenActual) return;
  tokenActual = null;
  vencimientoMs = 0;
};

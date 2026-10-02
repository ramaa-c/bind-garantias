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

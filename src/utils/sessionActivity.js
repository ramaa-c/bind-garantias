// Timestamp de última actividad, compartido entre pestañas del mismo origen
// (localStorage) y sobreviviente a recargas/cierres de pestaña - a
// diferencia de un timer en memoria, esto permite detectar al reabrir la
// app que ya pasó el tiempo de inactividad permitido, en vez de arrancar
// un timer nuevo de regalo. Ver useSessionTimeout.
export const SESSION_ACTIVITY_STORAGE_KEY = "bind_session_last_activity";

export const getLastActivity = () => {
  try {
    const raw = window.localStorage.getItem(SESSION_ACTIVITY_STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
};

export const setLastActivity = (timestamp = Date.now()) => {
  try {
    window.localStorage.setItem(
      SESSION_ACTIVITY_STORAGE_KEY,
      String(timestamp),
    );
  } catch {
    // localStorage puede fallar (incógnito con storage lleno, etc.) - no es
    // crítico, el timer en memoria de esta pestaña sigue funcionando igual.
  }
};

export const clearLastActivity = () => {
  try {
    window.localStorage.removeItem(SESSION_ACTIVITY_STORAGE_KEY);
  } catch {
    // no-op
  }
};

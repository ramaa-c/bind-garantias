const STORAGE_KEY = "modo_offline_config";
export const MODO_OFFLINE_EVENT = "modo-offline-changed";

export const MENSAJE_OFFLINE_DEFAULT =
  "Estamos realizando tareas de mantenimiento programado. Por favor, volvé a intentarlo en unos minutos.";

const configPorDefecto = {
  activo: false,
  mensaje: MENSAJE_OFFLINE_DEFAULT,
  fechaActivacion: null,
};

export const obtenerConfigOffline = () => {
  if (typeof window === "undefined") return configPorDefecto;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return configPorDefecto;
    return { ...configPorDefecto, ...JSON.parse(stored) };
  } catch (e) {
    console.error("Error leyendo configuración de modo offline:", e);
    return configPorDefecto;
  }
};

const guardarConfigOffline = (config) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(MODO_OFFLINE_EVENT));
};

export const activarModoOffline = (mensaje) => {
  guardarConfigOffline({
    activo: true,
    mensaje: mensaje?.trim() || MENSAJE_OFFLINE_DEFAULT,
    fechaActivacion: new Date().toISOString(),
  });
};

export const desactivarModoOffline = () => {
  guardarConfigOffline({ ...configPorDefecto });
};

export const actualizarMensajeOffline = (mensaje) => {
  const actual = obtenerConfigOffline();
  guardarConfigOffline({
    ...actual,
    mensaje: mensaje?.trim() || MENSAJE_OFFLINE_DEFAULT,
  });
};

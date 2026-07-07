import { useEffect, useState } from "react";
import { obtenerConfigOffline, MODO_OFFLINE_EVENT } from "../utils/modoOffline";

export const useModoOffline = () => {
  const [config, setConfig] = useState(obtenerConfigOffline);

  useEffect(() => {
    const actualizar = () => setConfig(obtenerConfigOffline());
    window.addEventListener(MODO_OFFLINE_EVENT, actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener(MODO_OFFLINE_EVENT, actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  return config;
};

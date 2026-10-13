import { useEffect, useRef, useState } from "react";

// Cuánto dura cada fase visible del botón de descarga.
const MS_SPINNER = 400;
const MS_TILDE = 1100;

// Feedback visual para la descarga de un archivo ya cargado (SGRPLUSPLA-199:
// sin nada que mirar, el usuario clickeaba varias veces y terminaba con el
// mismo archivo bajado N veces).
//
// ⚠️ El punto del hook es la espera artificial, no adornarla: procesarArchivo
// (utils/fileUtils.js) está declarada async pero NO tiene un solo await - el
// contenido ya vino en base64 con archivosBackend, así que armar el blob y
// disparar la descarga es 100% sincrónico. Sin estos setTimeout, el "estoy
// descargando" y el "terminé" caen en el mismo batch de React y nunca se
// committea un render con el estado intermedio: no se ve el spinner Y el
// botón tampoco llega a deshabilitarse, que era justamente lo que tenía que
// frenar el doble click. El setTimeout garantiza un corte de macrotask real
// entre una fase y la otra.
//
// La descarga en sí NO se demora: se dispara primero, las esperas son solo
// del estado visual.
export const useDescargaConFeedback = () => {
  const [descarga, setDescarga] = useState({ key: null, fase: null });
  const timersRef = useRef([]);

  const limpiarTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => limpiarTimers, []);

  const descargar = async (key, ejecutarDescarga) => {
    if (descarga.fase === "cargando") return;
    limpiarTimers();
    setDescarga({ key, fase: "cargando" });

    try {
      await ejecutarDescarga();
      await new Promise((resolve) => {
        timersRef.current.push(setTimeout(resolve, MS_SPINNER));
      });
      setDescarga({ key, fase: "listo" });
      timersRef.current.push(
        setTimeout(() => setDescarga({ key: null, fase: null }), MS_TILDE),
      );
    } catch {
      // procesarArchivo ya muestra su propio toast de error - acá solo hay
      // que soltar el botón para que se pueda reintentar.
      setDescarga({ key: null, fase: null });
    }
  };

  const faseDe = (key) => (descarga.key === key ? descarga.fase : null);

  return { descargar, faseDe };
};

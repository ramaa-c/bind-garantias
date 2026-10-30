import { useEffect, useRef, useState } from "react";

// Cuánto dura cada fase visible del botón de descarga.
const MS_SPINNER = 400;
const MS_TILDE = 1100;

// Feedback visual para la descarga de un archivo ya cargado (SGRPLUSPLA-199:
// sin nada que mirar, el usuario clickeaba varias veces y terminaba con el
// mismo archivo bajado N veces).
//
// El contenido se pide a la API recién al descargar (ver procesarArchivo en
// utils/fileUtils.js), así que el spinner dura lo que tarde ese pedido. Las
// esperas de abajo son solo del estado visual y garantizan que se vea cada
// fase aunque la descarga termine enseguida. Una descarga que falla devuelve
// false: ya mostró su toast de error y el botón se suelta sin pasar por el
// tilde.
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
      const resultado = await ejecutarDescarga();
      if (resultado === false) {
        setDescarga({ key: null, fase: null });
        return;
      }
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

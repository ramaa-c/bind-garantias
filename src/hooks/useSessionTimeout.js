import { useEffect, useRef, useState, useCallback } from "react";
import {
  getLastActivity,
  setLastActivity,
  SESSION_ACTIVITY_STORAGE_KEY,
} from "../utils/sessionActivity";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
];

// No reprograma el timer de inactividad en cada pixel de mousemove - alcanza
// con marcar actividad una vez cada tantos segundos.
const ACTIVITY_THROTTLE_MS = 5000;

// Cierra sesión sola a los `idleMs` de inactividad, mostrando un aviso con
// cuenta regresiva `warningMs` antes del corte. `onTimeout` se guarda en un
// ref (actualizado en un efecto sin deps, no durante el render) para que el
// efecto que engancha los listeners solo dependa de
// [enabled, idleMs, warningMs] - valores primitivos y estables - y no se
// reinstale en cada render aunque el caller pase un `onTimeout` inline sin
// memoizar.
//
// La última actividad se persiste en localStorage (ver utils/sessionActivity)
// en vez de vivir solo en memoria: eso permite recalcular el tiempo real
// transcurrido - no solo reiniciar un timer nuevo - en tres momentos donde un
// timer puramente en memoria falla:
//   1. Al montar (recarga de página, o pestaña reabierta tras estar cerrada
//      20+ min con la sesión igual autenticada en localStorage).
//   2. Al volver de background (`visibilitychange`), corrigiendo cualquier
//      drift por el throttling de timers que aplican los navegadores a
//      pestañas no enfocadas.
//   3. Cuando OTRA pestaña reporta actividad (evento `storage`) - una sesión
//      abierta en dos pestañas se comporta como una sola.
//
// Todo `setState` queda dentro de callbacks (setTimeout/setInterval/
// listeners), nunca sincrónico en el cuerpo del efecto -
// react-hooks/set-state-in-effect lo prohíbe (cascading renders), y el
// primer `resync()` se difiere con setTimeout(0) por lo mismo. Tampoco hay
// ningún setState dentro de un updater funcional (`setX(prev => ...)`) con
// side effects: StrictMode invoca esos updaters dos veces a propósito para
// detectar impurezas, y un side effect ahí adentro (ej. onTimeout) se
// terminaba ejecutando doble.
export const useSessionTimeout = ({ enabled, idleMs, warningMs, onTimeout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warningMs / 1000));

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const secondsLeftRef = useRef(Math.ceil(warningMs / 1000));
  const showWarningRef = useRef(false);
  const lastLocalActivityRef = useRef(0);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  // `resync` se guarda en un ref para que tanto los listeners (dentro del
  // efecto) como `extenderSesion` (expuesto al consumidor, ej. el botón
  // "Seguir conectado") usen exactamente la misma lógica sin duplicarla.
  const resyncRef = useRef(() => {});

  useEffect(() => {
    if (!enabled) {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownRef.current);
      showWarningRef.current = false;
      const resetId = setTimeout(() => setShowWarning(false), 0);
      return () => clearTimeout(resetId);
    }

    const clearTimers = () => {
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownRef.current);
    };

    const startCountdown = (startSeconds) => {
      showWarningRef.current = true;
      setShowWarning(true);
      secondsLeftRef.current = startSeconds;
      setSecondsLeft(startSeconds);
      countdownRef.current = setInterval(() => {
        secondsLeftRef.current -= 1;
        if (secondsLeftRef.current <= 0) {
          clearInterval(countdownRef.current);
          setSecondsLeft(0);
          onTimeoutRef.current?.();
          return;
        }
        setSecondsLeft(secondsLeftRef.current);
      }, 1000);
    };

    // Único punto de verdad: recalcula todo a partir de la última actividad
    // persistida. Se llama al montar, al volver de background, y cuando otra
    // pestaña reporta actividad - así una sesión "vieja" retomada mucho
    // después expira al toque en vez de arrancar un timer nuevo de regalo.
    const resync = () => {
      clearTimers();
      const last = getLastActivity();
      const elapsed = last ? Date.now() - last : 0;
      const remaining = idleMs - elapsed;

      if (remaining <= 0) {
        showWarningRef.current = false;
        setShowWarning(false);
        onTimeoutRef.current?.();
        return;
      }

      if (remaining <= warningMs) {
        startCountdown(Math.ceil(remaining / 1000));
      } else {
        showWarningRef.current = false;
        setShowWarning(false);
        idleTimerRef.current = setTimeout(
          () => startCountdown(Math.ceil(warningMs / 1000)),
          remaining - warningMs,
        );
      }
    };

    resyncRef.current = resync;

    const markActivity = () => {
      setLastActivity();
      resync();
    };

    const handleLocalActivity = () => {
      // Mientras se muestra el aviso, un evento local ambiguo (ej. un wheel
      // que rebota de algo) no lo hace desaparecer solo - hace falta el
      // click explícito en "Seguir conectado" (extenderSesion) o una señal
      // fuerte de otra pestaña (handleStorage, más abajo).
      if (showWarningRef.current) return;
      const now = Date.now();
      if (now - lastLocalActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastLocalActivityRef.current = now;
      markActivity();
    };

    const handleStorage = (e) => {
      if (e.key !== SESSION_ACTIVITY_STORAGE_KEY) return;
      // Actividad real en OTRA pestaña: señal fuerte de presencia, sí puede
      // cerrar el aviso acá aunque esta pestaña esté mostrándolo.
      resync();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") resync();
    };

    const startId = setTimeout(resync, 0);
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleLocalActivity, { passive: true }),
    );
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(startId);
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleLocalActivity),
      );
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, idleMs, warningMs]);

  const extenderSesion = useCallback(() => {
    setLastActivity();
    resyncRef.current();
  }, []);

  return { showWarning, secondsLeft, extenderSesion };
};

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiInfo } from "react-icons/fi";
import styles from "./InfoTooltip.module.css";

const MARGIN = 8;

// Ícono chico que muestra una explicación corta al tocarlo/clickearlo (no
// solo al pasar el mouse): un tooltip nativo por :hover no sirve en mobile,
// donde no hay hover - acá se abre/cierra con click, funciona igual en
// touch y en desktop.
export const InfoTooltip = ({ texto, label = "Más información", placement = "bottom", variant = "client", size = "md" }) => {
  const [open, setOpen] = useState(false);
  // Coordenadas ya calculadas y "clampeadas" para la burbuja, en position:fixed.
  const [coords, setCoords] = useState(null);
  const wrapperRef = useRef(null);
  const bubbleRef = useRef(null);

  // Cierra y limpia coords en el mismo tick (no vía efecto): así el único
  // setCoords en un efecto es el que de verdad necesita serlo (medir la
  // burbuja ya renderizada, ver más abajo) — todo lo demás pasa dentro del
  // handler que lo dispara, como corresponde.
  const cerrarTooltip = () => {
    setOpen(false);
    setCoords(null);
  };

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      const dentroDelIcono = wrapperRef.current?.contains(e.target);
      const dentroDeLaBurbuja = bubbleRef.current?.contains(e.target);
      if (!dentroDelIcono && !dentroDeLaBurbuja) {
        cerrarTooltip();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") cerrarTooltip();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // La burbuja se porta a document.body (position: fixed) en vez de vivir
  // absolute adentro del wrapper: acá se la posiciona a mano, midiendo el
  // ícono Y la burbuja ya renderizada (arranca invisible - ver
  // styles.bubbleVisible - y recién se muestra una vez calculada la
  // posición real, para no dejar ver un salto), y siempre se "clampea"
  // adentro del viewport. Un anclaje fijo a un solo lado (izquierda o
  // derecha) no alcanza: el mismo ícono termina en puntos distintos de la
  // pantalla según el contenido de al lado, y según la pantalla se salía
  // para un lado o para el otro (reportado el 2026-08-26).
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = wrapperRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const triggerRect = trigger.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();

    let left = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2;
    left = Math.min(Math.max(left, MARGIN), window.innerWidth - bubbleRect.width - MARGIN);

    const top =
      placement === "top"
        ? triggerRect.top - bubbleRect.height - 8
        : triggerRect.bottom + 8;

    // Dónde queda la flechita: sigue apuntando al centro real del ícono,
    // no al centro de la burbuja (que ahora puede estar desplazada por el
    // clamp del borde de la pantalla).
    const arrowLeft = triggerRect.left + triggerRect.width / 2 - left;

    setCoords({ top, left, arrowLeft });
  }, [open, placement, texto]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.trigger} ${size === "sm" ? styles.triggerSm : (variant === "admin" ? styles.triggerAdmin : "")}`}
        onClick={() => (open ? cerrarTooltip() : setOpen(true))}
        aria-expanded={open}
        aria-label={label}
        title={label}
      >
        <FiInfo size={15} />
      </button>
      {open &&
        createPortal(
          <div
            ref={bubbleRef}
            className={`${styles.bubble} ${styles[placement]} ${coords ? styles.bubbleVisible : ""}`}
            role="tooltip"
            style={{
              top: coords ? coords.top : 0,
              left: coords ? coords.left : 0,
              "--arrow-left": coords ? `${coords.arrowLeft}px` : "50%",
            }}
          >
            {texto}
          </div>,
          document.body,
        )}
    </div>
  );
};

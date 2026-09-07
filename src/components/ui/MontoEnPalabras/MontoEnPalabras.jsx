import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown } from "react-icons/fi";
import { numeroALetras } from "../../../utils/numeroALetras";
import styles from "./MontoEnPalabras.module.css";

// Botón compacto (mismo ancho que el input de al lado, mismo espacio
// reservado que el mensaje de error de InputSimple - solo se muestra
// cuando ese input no tiene error, ver call sites) que despliega el monto
// completo en palabras en un popover por Portal a document.body - antes
// era un chip siempre visible que con montos grandes o se truncaba a la
// mitad (perdiendo el propósito de poder verificar el número a simple
// vista) o envolvía a varias líneas empujando el alto de la modal entera.
// Mismo mecanismo de Portal + position:fixed que ya usa SelectFecha para
// su calendario, así el popover no queda cortado por el overflow:auto del
// body de la modal ni deforma el layout de alrededor. No reemplaza ninguna
// validación: si el valor no se puede convertir (vacío, cero, fuera de
// rango) no renderiza nada.
export const MontoEnPalabras = ({ value }) => {
  const texto = numeroALetras(value);
  const [abierto, setAbierto] = useState(false);
  // "abajo" | "arriba": de qué lado del trigger terminó abriendo el
  // popover (ver useLayoutEffect) - determina cuál de los dos, trigger o
  // popover, pierde el redondeado en el borde que los une, para que se
  // vean como una sola pieza en vez de dos piezas sueltas apenas
  // superpuestas.
  const [placement, setPlacement] = useState("abajo");
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dentroTrigger = triggerRef.current?.contains(event.target);
      const dentroPopover = popoverRef.current?.contains(event.target);
      if (!dentroTrigger && !dentroPopover) setAbierto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Igual criterio que SelectFecha: mide el popover ya montado, decide
  // arriba/abajo según qué lado tiene más espacio y clampea contra los
  // bordes del viewport - nunca queda cortado ni fuera de pantalla. El
  // ancho se fija al del trigger (pedido explícito: que se ajuste al
  // ancho del input), así el texto envuelve prolijo en vez de desbordar.
  // GAP en 0: pegado al trigger a propósito, para que lea como una
  // extensión de la pill y no como un popover suelto flotando cerca.
  useLayoutEffect(() => {
    if (!abierto) return undefined;

    const MARGEN = 8;
    const GAP = 0;

    const posicionar = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const rect = trigger.getBoundingClientRect();
      popover.style.width = `${rect.width}px`;
      const altoPopover = popover.offsetHeight;

      const espacioAbajo = window.innerHeight - rect.bottom;
      const abreArriba = espacioAbajo < altoPopover + MARGEN && rect.top > espacioAbajo;
      setPlacement(abreArriba ? "arriba" : "abajo");

      const topIdeal = abreArriba ? rect.top - GAP - altoPopover : rect.bottom + GAP;
      const top = Math.max(MARGEN, Math.min(topIdeal, window.innerHeight - altoPopover - MARGEN));
      const left = Math.max(MARGEN, Math.min(rect.left, window.innerWidth - rect.width - MARGEN));

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      popover.style.visibility = "visible";
    };

    posicionar();
    window.addEventListener("scroll", posicionar, true);
    window.addEventListener("resize", posicionar);
    return () => {
      window.removeEventListener("scroll", posicionar, true);
      window.removeEventListener("resize", posicionar);
    };
  }, [abierto]);

  if (!texto) return null;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`${styles.trigger} ${abierto ? styles[`triggerAbierto-${placement}`] : ""}`}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        <span className={styles.triggerText}>{texto}</span>
        <FiChevronDown
          size={12}
          className={`${styles.chevron} ${abierto ? styles.chevronAbierto : ""}`}
        />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={popoverRef}
            className={`${styles.popover} ${styles[`popover-${placement}`]}`}
            style={{ position: "fixed" }}
          >
            {texto}
          </div>,
          document.body,
        )}
    </>
  );
};

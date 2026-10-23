import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { PETALOS, TRAZOS_PALABRA, VIEWBOX_PALABRA } from "./marcaBind";
import styles from "./LoadingScreen.module.css";

// Dos variantes (canvas "Pantalla de carga"):
// - "ensamble": la flor se arma y aparece "bind garantías". Solo en el
//   primer ingreso: la secuencia de cargas del arranque con sesión iniciada
//   (si el arranque fue el login, la de después de loguearse).
// - "floracion": la flor se abre y se cierra con ondas. Todas las demás.
// Una secuencia de arranque son las LoadingScreen que se encadenan sin
// pausa (plataforma → acceso → perfil): termina cuando no queda ninguna
// montada durante FIN_SECUENCIA_MS.
const FIN_SECUENCIA_MS = 600;
let pantallasMontadas = 0;
let temporizadorFin = null;
let ingresoMostrado = false;

function useVarianteCarga(forzada) {
  const [variante] = useState(() => forzada || (ingresoMostrado ? "floracion" : "ensamble"));

  useEffect(() => {
    pantallasMontadas += 1;
    clearTimeout(temporizadorFin);
    return () => {
      pantallasMontadas -= 1;
      if (pantallasMontadas > 0) return;
      temporizadorFin = setTimeout(() => {
        if (useAuthStore.getState().isAuthenticated) ingresoMostrado = true;
      }, FIN_SECUENCIA_MS);
    };
  }, []);

  return variante;
}

function Flor({ className, tamano }) {
  return (
    <svg
      className={className}
      width={tamano}
      height={(tamano * 68) / 48}
      viewBox="0 0 48 68"
      aria-hidden="true"
    >
      <g className={styles.florGrupo}>
        {PETALOS.map((puntos, i) => (
          <polygon key={i} className={styles.petalo} style={{ "--i": i }} points={puntos} />
        ))}
      </g>
    </svg>
  );
}

export function LoadingScreen({ title, message, absolute = false, variante: varianteForzada }) {
  const variante = useVarianteCarga(varianteForzada);

  const content = (
    <div
      className={`${styles.overlay} ${absolute ? styles.absolute : ""}`}
      role="status"
      aria-live="polite"
      aria-label={title || "Cargando"}
    >
      <div className={variante === "ensamble" ? styles.fondoGrilla : styles.fondoHalo} aria-hidden="true" />
      <div className={styles.content}>
        {variante === "ensamble" ? (
          <div className={styles.marca}>
            <Flor className={styles.florEnsamble} tamano={54} />
            <svg
              className={styles.palabra}
              viewBox={VIEWBOX_PALABRA}
              height={44}
              width={(44 * 81.254) / 52}
              aria-hidden="true"
            >
              {TRAZOS_PALABRA.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </div>
        ) : (
          <div className={styles.floracion}>
            <span className={styles.onda} aria-hidden="true" />
            <span className={`${styles.onda} ${styles.ondaDemorada}`} aria-hidden="true" />
            <Flor className={styles.florFloracion} tamano={56} />
          </div>
        )}

        {title && <h3 className={styles.titulo}>{title}</h3>}
        {message && <p className={styles.mensaje}>{message}</p>}

        {variante === "ensamble" && (
          <span className={styles.puntos} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>
    </div>
  );

  if (absolute) {
    return content;
  }

  return createPortal(content, document.body);
}

export default LoadingScreen;

import React from "react";
import { FiFileText, FiUsers, FiCheck } from "react-icons/fi";
import { PANTALLAS_CDA } from "../../../../utils/pantallasCda";
import styles from "./PantallaTabs.module.css";

const ICONOS = {
  PANTALLA_INGRESO_CUIT: FiFileText,
  PANTALLA_SOCIOS: FiUsers,
};

// Selector de pantalla para las vistas de CDAs por cadena: cada cadena tiene
// un GrupoCda independiente por pantalla, y ambos hay que configurarlos por
// separado. Se muestra como un paso a paso (1, 2) porque así ocurre de
// verdad en el onboarding real: primero se valida el CUIT, después a los
// socios. El estado (cuántos CDAs tiene cada uno) ayuda a ver de un vistazo
// cuál falta completar.
export const PantallaTabs = ({ value, onChange, estados = {} }) => {
  return (
    <div className={styles.stepper}>
      {PANTALLAS_CDA.map((p, i) => {
        const Icono = ICONOS[p.value] || FiFileText;
        const isActive = value === p.value;
        const estado = estados[p.value];
        const cantidad = estado?.cantidad;
        const cargando = estado?.cargando;
        const conError = estado?.error;

        return (
          <React.Fragment key={p.value}>
            <button
              type="button"
              className={`${styles.step} ${isActive ? styles.stepActive : ""}`}
              onClick={() => onChange(p.value)}
              aria-current={isActive ? "step" : undefined}
            >
              <span className={styles.stepNumber}>{i + 1}</span>
              <Icono className={styles.stepIcon} size={18} />
              <span className={styles.stepText}>
                <span className={styles.stepLabel}>{p.label}</span>
                {cargando ? (
                  <span className={styles.stepStatusSkeleton} />
                ) : conError ? (
                  <span className={styles.stepStatusErrorText}>Error al cargar, no confiar</span>
                ) : cantidad > 0 ? (
                  <span className={styles.stepStatusOk}>
                    <FiCheck size={11} /> {cantidad} CDA{cantidad !== 1 ? "s" : ""} activo{cantidad !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className={styles.stepStatusEmpty}>Sin configurar</span>
                )}
              </span>
            </button>
            {i < PANTALLAS_CDA.length - 1 && <span className={styles.connector} aria-hidden="true" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

import React from "react";
import { FiCheck, FiChevronLeft, FiRotateCcw } from "react-icons/fi";
import styles from "./BarraProgreso.module.css";

export const BarraProgreso = ({
  hitos = ["Empresa", "Operación", "Socios", "Documentos", "Confirmación"],
  hitoActual = 1,
  onVolver = null,
  onVolverInicio = null,
  onReiniciar = null,
}) => {
  return (
    <div className={styles.wizardContainer}>
      <div className={styles.sideAction}>
        {onVolver ? (
          <button type="button" onClick={onVolver} className={styles.btnAction}>
            <FiChevronLeft size={16} />
            <span className={styles.btnText}>Volver</span>
          </button>
        ) : onVolverInicio ? (
          <button
            type="button"
            onClick={onVolverInicio}
            className={styles.btnAction}
          >
            <FiChevronLeft size={16} />
            <span className={styles.btnText}>Inicio</span>
          </button>
        ) : (
          <div className={styles.emptyAction} />
        )}
      </div>

      <div className={styles.stepperWrapper}>
        {hitos.map((hito, index) => {
          const numeroHito = index + 1;
          const isCompleted = hitoActual > numeroHito;
          const isCurrent = hitoActual === numeroHito;

          return (
            <React.Fragment key={hito}>
              <div
                className={`${styles.stepNode} ${
                  isCompleted
                    ? styles.completed
                    : isCurrent
                      ? styles.current
                      : styles.pending
                }`}
              >
                {isCurrent && <div className={styles.badgeCurrent}>Actual</div>}

                <div className={styles.circleContainer}>
                  <div className={styles.circle}>
                    {isCompleted ? (
                      <FiCheck size={14} className={styles.checkIcon} />
                    ) : (
                      <span className={styles.number}>{numeroHito}</span>
                    )}
                  </div>
                </div>

                <span className={styles.label}>{hito}</span>
              </div>

              {index < hitos.length - 1 && (
                <div
                  className={`${styles.connector} ${
                    isCompleted ? styles.connectorCompleted : ""
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.sideActionRight}>
        {onReiniciar ? (
          <button
            type="button"
            onClick={onReiniciar}
            className={styles.btnAction}
          >
            <span className={styles.btnText}>Reiniciar</span>
            <FiRotateCcw size={14} />
          </button>
        ) : (
          <div className={styles.emptyAction} />
        )}
      </div>
    </div>
  );
};

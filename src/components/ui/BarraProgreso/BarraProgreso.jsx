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
  const total = hitos.length;
  const pct = Math.round(((hitoActual - 1) / (total - 1)) * 100);

  return (
    <nav className={styles.stepper} aria-label="Progreso del formulario">
      {/* ── IZQUIERDA ─────────────────────────────────────────────── */}
      <div className={styles.side}>
        {onVolver || onVolverInicio ? (
          <button
            type="button"
            onClick={onVolver ?? onVolverInicio}
            className={styles.btn}
          >
            <FiChevronLeft size={14} strokeWidth={2.5} />
            <span className={styles.btnLabel}>
              {onVolverInicio ? "Inicio" : "Volver"}
            </span>
          </button>
        ) : (
          <div className={styles.phantom} />
        )}
      </div>

      {/* ── TRACK ────────────────────────────────────────────────── */}
      <div className={styles.track}>
        <div className={styles.mobileIndicator}>
          <span className={styles.mobileName}>{hitos[hitoActual - 1]}</span>
          <div className={styles.mobileBarWrap}>
            <div
              className={styles.mobileBarFill}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={styles.mobileCount}>
            {hitoActual}
            <span className={styles.mobileCountTotal}>/{total}</span>
          </span>
        </div>

        <ol className={styles.steps}>
          {hitos.map((hito, i) => {
            const n = i + 1;
            const done = hitoActual > n;
            const active = hitoActual === n;
            const stateClass = done
              ? styles.done
              : active
                ? styles.active
                : styles.pending;

            return (
              <React.Fragment key={hito}>
                <li
                  className={`${styles.step} ${stateClass}`}
                  aria-current={active ? "step" : undefined}
                >
                  <div className={styles.circleWrap}>
                    <div className={styles.circle}>
                      {done ? (
                        <FiCheck size={11} strokeWidth={3} />
                      ) : (
                        <span className={styles.num}>{n}</span>
                      )}
                    </div>
                    {active && <div className={styles.ring} />}
                  </div>
                  <span className={styles.label}>{hito}</span>
                </li>

                {i < hitos.length - 1 && (
                  <div
                    className={`${styles.connector} ${done ? styles.connectorDone : ""}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>

      {/* ── DERECHA ───────────────────────────────────────────────── */}
      <div className={`${styles.side} ${styles.sideRight}`}>
        {onReiniciar ? (
          <button
            type="button"
            onClick={onReiniciar}
            className={`${styles.btn} ${styles.btnReset}`}
          >
            <span className={styles.btnLabel}>Reiniciar</span>
            <FiRotateCcw size={12} />
          </button>
        ) : (
          <div className={styles.phantom} />
        )}
      </div>
    </nav>
  );
};

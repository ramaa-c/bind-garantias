import React from "react";
import { createPortal } from "react-dom";
import Spinner from "../Spinner/Spinner";
import { Button } from "../Button/Button";
import styles from "./ProcesamientoModal.module.css";

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BADGE_LABELS = {
  completado: "Completado",
  cargando: "En proceso",
  pendiente: "Pendiente",
  error: "Falló",
};

export const ProcesamientoModal = ({
  isOpen,
  titulo,
  pasos = [],
  hasError = false,
  isSystemError = false,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {titulo && (
          <div className={styles.header}>
            <h3 className={styles.titulo}>{titulo}</h3>
          </div>
        )}

        <ul className={styles.listaPasos}>
          {pasos.map((paso, index) => {
            const isCompleted = paso.estado === "completado";
            const isError = paso.estado === "error";
            const isLoading = paso.estado === "cargando";
            const isPending = paso.estado === "pendiente";

            return (
              <li
                key={paso.id}
                className={styles.pasoContainer}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.track}>
                  <div
                    className={`${styles.circuloIcono} ${styles[`icono_${paso.estado}`]}`}
                    aria-label={BADGE_LABELS[paso.estado]}
                  >
                    {isCompleted && <CheckIcon />}
                    {isLoading && <Spinner size={18} center={false} />}
                    {isError && <ErrorIcon />}
                    {isPending && <span className={styles.dotPendiente} />}
                  </div>

                  {index < pasos.length - 1 && (
                    <div
                      className={`${styles.lineaConectora} ${isCompleted ? styles.lineaCompletada : ""} ${isError ? styles.lineaError : ""}`}
                    />
                  )}
                </div>

                <div className={styles.contenidoPaso}>
                  <div className={styles.cabeceraPaso}>
                    <span
                      className={`${styles.etiquetaTitulo} ${styles[`label_${paso.estado}`]}`}
                    >
                      {paso.etiqueta}
                    </span>
                    <span
                      className={`${styles.badge} ${styles[`badge_${paso.estado}`]}`}
                    >
                      {BADGE_LABELS[paso.estado]}
                    </span>
                  </div>
                  {paso.descripcion && !isError && (
                    <p className={styles.descripcionPaso}>{paso.descripcion}</p>
                  )}
                  {isError && paso.errores && paso.errores.length > 0 && (
                    <ul className={styles.listaErroresPaso}>
                      {paso.errores.map((err, i) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  )}
                  {isError && paso.error && (!paso.errores || paso.errores.length === 0) && (
                    <p className={styles.errorPaso}>{paso.error}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {hasError && (
          <div className={styles.footerAcciones}>
            <Button variant={isSystemError ? "secondary" : "primary"} onClick={onClose}>
              Aceptar
            </Button>
            {isSystemError && onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Reintentar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ProcesamientoModal;

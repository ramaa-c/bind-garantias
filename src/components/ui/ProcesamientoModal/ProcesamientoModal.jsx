import React from "react";
import {
  FiCheck,
  FiX,
  FiAlertCircle,
  FiAlertTriangle,
  FiShield,
} from "react-icons/fi";
import { Modal } from "../Modal/Modal";
import { Button } from "../Button/Button";
import styles from "./ProcesamientoModal.module.css";

const ESTADO_LABELS = {
  completado: "Completado",
  cargando: "En proceso",
  pendiente: "Pendiente",
  error: "Falló",
  alerta: "Revisión",
};

// Estado general que se muestra en la cabecera, derivado de los pasos:
// - en curso mientras algún paso esté cargando,
// - error solo si es un error de sistema (caída de un servicio, red...),
// - alerta si algún paso terminó en error/alerta de negocio (se puede seguir),
// - ok si todo se completó.
const estadoGeneral = (pasos, isSystemError) => {
  if (pasos.some((p) => p.estado === "cargando")) return "cargando";
  if (isSystemError) return "error";
  if (pasos.some((p) => p.estado === "error" || p.estado === "alerta"))
    return "alerta";
  if (pasos.length > 0 && pasos.every((p) => p.estado === "completado"))
    return "ok";
  return "cargando";
};

const SUBTITULOS = {
  cargando: "Esto toma unos segundos.",
  ok: "Proceso completado.",
  alerta: "Podés continuar con la carga.",
  error: "Fue un problema de nuestro lado, no de tus datos.",
};

export const ProcesamientoModal = ({
  isOpen,
  titulo,
  subtitulo,
  pasos = [],
  hasError = false,
  isSystemError = false,
  onClose,
  onRetry,
}) => {
  const general = estadoGeneral(pasos, isSystemError);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="34rem"
      preventClose
      hideCloseButton
      footer={
        hasError ? (
          <div className={styles.footerAcciones}>
            {isSystemError && onRetry ? (
              <>
                <Button variant="outline" onClick={onClose} className={styles.footerBtn}>
                  Continuar igual
                </Button>
                <Button variant="primary" onClick={onRetry} className={styles.footerBtn}>
                  Reintentar
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={onClose} className={styles.footerBtn}>
                Continuar
              </Button>
            )}
          </div>
        ) : (
          <p className={styles.footerNota}>
            <FiShield aria-hidden="true" />
            No cierres esta ventana. Tus datos viajan encriptados.
          </p>
        )
      }
    >
      <div aria-live="polite">
        {titulo && (
          <div className={styles.header}>
            <span
              className={`${styles.headerIcono} ${styles[`general_${general}`]}`}
              aria-hidden="true"
            >
              {general === "cargando" && <span className={styles.spinner} />}
              {general === "ok" && <FiCheck />}
              {general === "alerta" && <FiAlertCircle />}
              {general === "error" && <FiAlertTriangle />}
            </span>
            <div className={styles.headerTexto}>
              <h3 className={styles.titulo}>{titulo}</h3>
              <p className={styles.subtitulo}>
                {subtitulo || SUBTITULOS[general]}
              </p>
            </div>
          </div>
        )}

        <ol className={styles.listaPasos}>
          {pasos.map((paso, index) => {
            const isCompleted = paso.estado === "completado";
            const isError = paso.estado === "error";
            const isAlerta = paso.estado === "alerta";
            const isLoading = paso.estado === "cargando";
            const isPending = paso.estado === "pendiente";
            const mensajes =
              paso.errores && paso.errores.length > 0
                ? paso.errores
                : paso.error
                  ? [paso.error]
                  : [];

            return (
              <li
                key={paso.id}
                className={`${styles.paso} ${styles[`paso_${paso.estado}`] || ""}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <span className={styles.dot}>
                  {isCompleted && <FiCheck strokeWidth={3} />}
                  {isLoading && <span className={styles.spinnerChico} />}
                  {isError && <FiX strokeWidth={3} />}
                  {isAlerta && <FiAlertCircle strokeWidth={2.5} />}
                  {isPending && <span className={styles.dotPendiente} />}
                  <span className={styles.srOnly}>{ESTADO_LABELS[paso.estado]}</span>
                </span>

                <div className={styles.contenido}>
                  <span className={styles.etiqueta}>{paso.etiqueta}</span>
                  {paso.descripcion && !isError && !isAlerta && !isPending && (
                    <p className={styles.descripcion}>{paso.descripcion}</p>
                  )}
                  {(isError || isAlerta) && mensajes.length > 0 && (
                    <ul
                      className={`${styles.mensajes} ${isError ? styles.mensajesError : styles.mensajesAlerta}`}
                    >
                      {mensajes.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                  {isLoading && (
                    <span className={styles.barra} aria-hidden="true">
                      <span className={styles.barraRelleno} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Modal>
  );
};

export default ProcesamientoModal;

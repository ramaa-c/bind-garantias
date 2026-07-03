import React from "react";
import { FiHelpCircle, FiAlertTriangle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./ConfirmacionModal.module.css";

const ICONOS_POR_VARIANTE = {
  danger: FiAlertTriangle,
  blue: FiHelpCircle,
  default: FiHelpCircle,
};

export function ConfirmacionModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Estás seguro de que deseas continuar?",
  isLoading = false,
  variant = "default",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "primary",
  cancelVariant = "outline",
  maxWidth = "400px",
}) {
  const tono = styles[variant] ? variant : "default";
  const Icono = ICONOS_POR_VARIANTE[tono] || ICONOS_POR_VARIANTE.default;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      maxWidth={maxWidth}
      variant={variant === "blue" ? "blue" : "default"}
    >
      <div className={styles.container}>
        <div className={`${styles.iconBadge} ${styles[tono]}`}>
          <span className={`${styles.iconPulse} ${styles[tono]}`} />
          <Icono className={styles.icon} />
        </div>

        <p className={styles.mensaje}>{mensaje}</p>

        <div
          className={`${styles.actions} ${variant === "blue" ? styles.actionsBlue : ""}`}
        >
          <Button variant={cancelVariant} onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

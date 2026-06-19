import React from "react";
import { FiAlertCircle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./ConfirmacionModal.module.css";

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      maxWidth={maxWidth}
      variant={variant}
    >
      <div className={styles.container}>
        <div
          className={`${styles.iconContainer} ${styles[variant] || ""} ${variant === "blue" ? styles.blue : ""}`}
        >
          <FiAlertCircle className={styles.icon} />
        </div>
        <p className={styles.mensaje}>{mensaje}</p>
        <div className={styles.actions}>
          <Button
            variant={cancelVariant}
            onClick={onClose}
            disabled={isLoading}
          >
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

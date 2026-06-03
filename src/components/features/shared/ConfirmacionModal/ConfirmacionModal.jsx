import React from "react";
import { FiAlertCircle } from "react-icons/fi";
import { Modal, Button } from "../../../ui";
import styles from "./ConfirmacionModal.module.css";

export function ConfirmacionModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Estás seguro de que deseas continuar?",
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo} maxWidth="400px">
      <div className={styles.container}>
        <div className={styles.iconContainer}>
          <FiAlertCircle className={styles.icon} />
        </div>
        <p className={styles.mensaje}>{mensaje}</p>
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isLoading} isLoading={isLoading}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

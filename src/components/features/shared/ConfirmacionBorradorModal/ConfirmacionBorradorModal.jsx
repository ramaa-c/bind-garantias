import React from "react";
import { FiAlertCircle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./ConfirmacionBorradorModal.module.css";

export default function ConfirmacionBorradorModal({ isOpen, onClose, onConfirm, onContinueBorrador }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <div className={styles.body}>
        <div className={styles.iconWrapper}>
          <FiAlertCircle size={32} />
        </div>

        <h2 className={styles.title}>Solicitud en curso</h2>

        <p className={styles.description}>
          ¿Deseas empezar una nueva solicitud desde cero o continuar donde lo
          dejaste? Se perderán los datos no guardados si empiezas de cero.
        </p>

        <div className={styles.footer}>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className={styles.btnConfirm}
          >
            Empezar nueva
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onContinueBorrador}
            className={styles.btnCancel}
          >
            Continuar borrador
          </Button>
        </div>
      </div>
    </Modal>
  );
}

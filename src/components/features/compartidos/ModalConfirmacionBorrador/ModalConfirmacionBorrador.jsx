import React, { useRef } from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { Button } from "../../../ui";
import styles from "./ModalConfirmacionBorrador.module.css";

export default function ModalConfirmacionBorrador({ isOpen, onClose, onConfirm }) {
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className={styles.modalContainer}
        ref={modalRef}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

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
              variant="primary"
              onClick={onConfirm}
              className={styles.btnConfirm}
            >
              Empezar nueva
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Continuar borrador
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

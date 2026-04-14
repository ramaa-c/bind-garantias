import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { Button } from "../../../../ui";
import { useEscape } from "../../../../../hooks/useEscape";
import styles from "./ModalConfirmacionBorrador.module.css";

export default function ModalConfirmacionBorrador({ isOpen, onClose, onConfirm, onContinueBorrador }) {
  const modalRef = useRef(null);

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayClick}
    >
      <div
        className={styles.modalContainer}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.btnClose} onClick={onClose}>
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
      </div>
    </div>,
    document.body
  );
}

import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { FiSmartphone, FiX } from "react-icons/fi";
import { Button, InputFlotante } from "../";
import { useEscape } from "../../../hooks/useEscape";
import styles from "./ModalSms.module.css";

export default function ModalSms({
  isOpen,
  onClose,
  codigoSms,
  setCodigoSms,
  onConfirmar,
}) {
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
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

        <form
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault();
            if (codigoSms.length === 6) {
              onConfirmar();
            }
          }}
        >
          <div className={styles.iconWrapper}>
            <FiSmartphone size={32} />
          </div>

          <h2 className={styles.title}>Verificá tu celular</h2>

          <p className={styles.description}>
            Te enviamos un SMS con un código de verificación. Ingresalo a
            continuación para continuar.
          </p>

          <div className={styles.inputSection}>
            <InputFlotante
              label="Código de verificación"
              value={codigoSms}
              maxLength={6}
              onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, ""))}
              esValido={codigoSms.length === 6}
            />
          </div>

          <div className={styles.footer}>
            <Button
              type="submit"
              variant="primary"
              className={styles.btnConfirm}
              disabled={codigoSms.length < 6}
            >
              CONFIRMAR
            </Button>
          </div>

          <p className={styles.resendText}>
            ¿No recibiste el código?{" "}
            <span className={styles.resendLink}>Reenviar SMS</span>
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
}

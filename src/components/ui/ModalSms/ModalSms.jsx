import React, { useRef } from "react";
import { FiSmartphone, FiX } from "react-icons/fi";
import { Button, InputFlotante } from "../";
import styles from "./ModalSms.module.css";

export default function ModalSms({
  isOpen,
  onClose,
  codigoSms,
  setCodigoSms,
  onConfirmar,
}) {
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
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.btnClose} onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className={styles.body}>
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
              variant="primary"
              onClick={onConfirmar}
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
        </div>
      </div>
    </div>
  );
}

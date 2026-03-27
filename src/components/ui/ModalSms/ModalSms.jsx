import React from "react";
import { FiSmartphone, FiX } from "react-icons/fi";
import { Button, InputFlotante, Modal } from "../";
import styles from "./ModalSms.module.css";

export default function ModalSms({
  isOpen,
  onClose,
  codigoSms,
  setCodigoSms,
  onConfirmar,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName={styles.overlay}
      modalClassName={styles.modalContainer}
      hideCloseButton={true}
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
    </Modal>
  );
}

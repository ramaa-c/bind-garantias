import React from "react";
import { Button, InputCodigo } from "../"; 
import styles from "./ModalSms.module.css";

export default function ModalSms({
  isOpen,
  onClose,
  codigoSms,
  setCodigoSms,
  onConfirmar
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        
        <div className={styles.header}>
          <h2 className={styles.title}>Ingresá el código de verificación</h2>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            Te enviamos un sms con un código de verificación para que valides tu celular.
          </p>

          <InputCodigo
            label="Código verificación *"
            value={codigoSms}
            onChange={setCodigoSms}
          />
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose} className={styles.btnCancel}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={onConfirmar}>
            ACEPTAR
          </Button>
        </div>

      </div>
    </div>
  );
}
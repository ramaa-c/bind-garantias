import React from "react";
import { FiCheck } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./MigracionExitosaModal.module.css";

// Aviso "fuerte" de migración exitosa a SGR+: reemplaza al toast (que pasa
// desapercibido) para un momento que el usuario necesita notar sí o sí —
// que sus datos ya quedaron sincronizados.
export function MigracionExitosaModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="440px">
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <span className={styles.ring} />
          <span className={styles.ring} />
          <span className={styles.badge}>
            <FiCheck size={30} strokeWidth={3} />
          </span>
        </div>

        <h2 className={styles.title}>¡Legajo sincronizado con éxito!</h2>
        <p className={styles.mensaje}>
          Todos los datos y documentos de tu empresa se cargaron y migraron
          correctamente. Tu legajo ya está al día.
        </p>

        <Button variant="primary" onClick={onClose} className={styles.btnAceptar}>
          Aceptar
        </Button>
      </div>
    </Modal>
  );
}

export default MigracionExitosaModal;

import React from "react";
import { FiCheck } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./MigracionExitosaModal.module.css";

// Aviso "fuerte" de que el legajo quedó completo: reemplaza al toast (que
// pasa desapercibido) para un momento que hay que notar sí o sí. De cara al
// CLIENTE esto no es "se migró a SGR+" (ver LegajoUniversalBar y
// EstadoMigracionModal, acordado con Victor el 2026-08-12) — es simplemente
// que ya no le falta nada por cargar. El ADMIN sí necesita saber que la
// migración a SGR+ ocurrió de verdad, así que en adminMode se lo dice tal
// cual — a él la migración no se le puede ocultar, es justamente lo que
// tiene que confirmar.
export function MigracionExitosaModal({ isOpen, onClose, adminMode = false }) {
  const titulo = adminMode ? "¡Migración exitosa!" : "¡Felicitaciones!";
  const mensaje = adminMode
    ? "El socio se migró a SGR+ correctamente."
    : "Completaste todos los datos y documentos de tu empresa. Tu legajo ya está al día.";

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

        <h2 className={styles.title}>{titulo}</h2>
        <p className={styles.mensaje}>{mensaje}</p>

        <Button variant="primary" onClick={onClose} className={styles.btnAceptar}>
          Aceptar
        </Button>
      </div>
    </Modal>
  );
}

export default MigracionExitosaModal;

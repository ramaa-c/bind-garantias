import React from "react";
import { FiFileText } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./ConfirmacionBorradorModal.module.css";

export default function ConfirmacionBorradorModal({ isOpen, onClose, onConfirm, onContinueBorrador }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="460px" variant="confirm">
      <div className={styles.body}>
        <div className={styles.head}>
          <span className={styles.tile} aria-hidden="true">
            <FiFileText />
          </span>
          <div className={styles.texto}>
            <h2 className={styles.title}>Tenés una solicitud sin terminar</h2>
            <p className={styles.description}>
              Podés retomarla donde la dejaste o empezar una nueva. Si empezás
              de cero, se pierden los datos que no guardaste.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="outline" onClick={onConfirm}>
            Empezar nueva
          </Button>
          <Button type="button" variant="primary" onClick={onContinueBorrador}>
            Continuar borrador
          </Button>
        </div>
      </div>
    </Modal>
  );
}

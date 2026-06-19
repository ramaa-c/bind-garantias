import React from "react";
import { FiLock, FiFileText, FiUsers, FiArrowRight } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./BloqueoLegajoModal.module.css";

export function BloqueoLegajoModal({
  isOpen,
  onClose,
  onGoToSocios,
  onGoToDocumentacion,
  faltanDocumentos,
  faltanLegajo,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="450px" variant="default">
      <div className={styles.container}>
        <div className={styles.iconContainer}>
          <FiLock className={styles.icon} />
        </div>
        
        <h3 className={styles.title}>Completá tu Legajo</h3>
        <p className={styles.mensaje}>
          Para iniciar una nueva operación, primero debes completar la información obligatoria de tu legajo corporativo.
        </p>

        <div className={styles.actionsContainer}>
          <div className={styles.actionButtons}>
            {faltanLegajo && (
              <Button variant="primary" className={styles.actionBtn} onClick={onGoToSocios}>
                <div className={styles.btnContent}>
                  <FiUsers className={styles.btnIcon} />
                  <span>Completar Perfil Societario</span>
                </div>
                <FiArrowRight className={styles.arrowIcon} />
              </Button>
            )}
            
            {faltanDocumentos && (
              <Button variant="primary" className={styles.actionBtn} onClick={onGoToDocumentacion}>
                <div className={styles.btnContent}>
                  <FiFileText className={styles.btnIcon} />
                  <span>Cargar Documentación</span>
                </div>
                <FiArrowRight className={styles.arrowIcon} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default BloqueoLegajoModal;

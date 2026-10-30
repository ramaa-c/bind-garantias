import React from "react";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./InformativoModal.module.css";

const TONOS = {
  warning: styles.warning,
  info: styles.info,
  success: styles.success,
  error: styles.error,
};

export default function InformativoModal({
  isOpen,
  onClose,
  icon,
  variant = "warning",
  title,
  description,
  buttonText = "Entendido",
  maxWidth = "28rem",
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth} variant="confirm">
      <div className={`${styles.container} ${TONOS[variant] || styles.info}`}>
        {icon && (
          <span className={styles.iconWrapper} aria-hidden="true">
            {icon}
          </span>
        )}

        {title && <h3 className={styles.title}>{title}</h3>}

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose} className={styles.button}>
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

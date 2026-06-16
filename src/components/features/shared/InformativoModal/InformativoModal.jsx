import React from "react";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./InformativoModal.module.css";

const variants = {
  warning: {
    background: "rgba(255, 193, 7, 0.1)",
    border: "2px solid rgba(255, 193, 7, 0.25)",
  },
  info: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "2px solid rgba(59, 130, 246, 0.25)",
  },
  success: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "2px solid rgba(16, 185, 129, 0.25)",
  },
  error: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "2px solid rgba(239, 68, 68, 0.25)",
  },
};

export default function InformativoModal({
  isOpen,
  onClose,
  icon,
  variant = "warning",
  title,
  description,
  buttonText = "Entendido",
  maxWidth = "26rem",
}) {
  const currentVariant = variants[variant] || variants.info;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
      <div className={styles.container}>
        {icon && (
          <div
            className={styles.iconWrapper}
            style={{
              background: currentVariant.background,
              border: currentVariant.border,
            }}
          >
            {icon}
          </div>
        )}

        {title && <h3 className={styles.title}>{title}</h3>}

        {description && <p className={styles.description}>{description}</p>}

        <Button variant="primary" onClick={onClose} className={styles.button}>
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
}

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { useEscape } from "../../../hooks/useEscape";
import styles from "./Modal.module.css";

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "600px",
  className = "",
}) => {
  useEscape(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={`${styles.modalBox} ${className}`}
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            {title && (
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            )}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

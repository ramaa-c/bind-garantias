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
  variant = "default",
  allowOverflow = false,
  // Mientras hay una acción en curso (ej. guardando/eliminando) no debería
  // poder cerrarse haciendo click afuera, con ESC o con la X: solo los
  // botones internos (que ya se deshabilitan con isLoading) pueden decidir.
  preventClose = false,
  // Para modales sin ninguna vía de cierre propia (ej. ProcesamientoModal):
  // ni X, ni ESC, ni click afuera - solo los botones de acción del propio
  // contenido (que reciben onClose directo) pueden cerrarlo. Sin esto,
  // el botón flotante quedaría visible pero inerte bajo preventClose, lo
  // cual confunde más que no tener botón.
  hideCloseButton = false,
}) => {
  const handleClose = () => {
    if (preventClose) return;
    onClose();
  };

  useEscape(handleClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleClose}>
      <div
        className={`${styles.modalBox} ${variant === "blue" ? styles.blueVariant : ""} ${variant === "confirm" ? styles.confirmVariant : ""} ${allowOverflow ? styles.allowOverflow : ""} ${className}`}
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* ── HEADER ── */}
        {title || subtitle ? (
          <div className={styles.header}>
            <div className={styles.headerText}>
              {title && (
                <h2 id="modal-title" className={styles.title}>
                  {title}
                </h2>
              )}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Cerrar modal"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        ) : (
          !hideCloseButton && (
            <button
              type="button"
              className={styles.closeButtonFloating}
              onClick={handleClose}
              aria-label="Cerrar modal"
            >
              <FiX size={18} />
            </button>
          )
        )}

        {/* ── BODY ── */}
        <div className={`${styles.body} ${allowOverflow ? styles.allowOverflow : ""}`}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
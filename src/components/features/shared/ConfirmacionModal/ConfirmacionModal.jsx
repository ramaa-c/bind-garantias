import React, { useEffect, useRef } from "react";
import { FiCheck, FiAlertTriangle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./ConfirmacionModal.module.css";

export function ConfirmacionModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Estás seguro de que deseas continuar?",
  isLoading = false,
  variant = "default",
  tone = "neutral",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant,
  cancelVariant,
  maxWidth = "420px",
}) {
  const dialogRef = useRef(null);
  const isDanger = tone === "danger";

  const resolvedConfirmVariant =
    confirmVariant || (isDanger ? "danger" : variant === "blue" ? "blue" : "primary");
  const resolvedCancelVariant =
    cancelVariant || (variant === "blue" ? "outlineBlue" : "outline");

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      dialogRef.current?.querySelector("button")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll("button:not(:disabled)");
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const toneClass = isDanger ? styles.danger : variant === "blue" ? styles.blue : styles.yellow;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth} variant="confirm">
      <div ref={dialogRef} className={`${styles.dialog} ${toneClass}`} onKeyDown={handleKeyDown}>
        <div className={styles.sealRow}>
          <div className={styles.seal}>
            {isDanger ? <FiAlertTriangle /> : <FiCheck />}
          </div>
          <h2 className={styles.title}>{titulo}</h2>
        </div>

        <div className={styles.perforation} />

        <div className={styles.mensaje}>{mensaje}</div>

        <div className={styles.perforation} />

        <div className={styles.actions}>
          <Button variant={resolvedCancelVariant} onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={resolvedConfirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

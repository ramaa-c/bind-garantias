import React, { useEffect, useRef, useState } from "react";
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
  preventClose = false,
  // Solo en la versión de cliente (ver `esAdmin` más abajo): ícono propio
  // del tile en lugar del genérico del tono, y una ficha opcional con el
  // sujeto de la acción (la persona o el archivo que se elimina, etc.).
  icono,
  detalle,
}) {
  const dialogRef = useRef(null);
  const isDanger = tone === "danger";
  const isWarning = tone === "warning";
  const isAlerta = isDanger || isWarning;

  // Guarda propia contra doble click, independiente del `isLoading` que
  // mande el caller: si `onConfirm` hace trabajo async ANTES de que el
  // mutation hook del caller marque su propio isPending (ej. resolver un ID
  // antes de disparar la mutación real), el prop `isLoading` llega tarde y
  // el botón queda clickeable un rato — suficiente para que dos o tres
  // clicks salgan antes de que se refleje. `isConfirmandoRef` es sincrónico
  // (se marca en el mismo tick del primer click, antes de cualquier await),
  // así que ningún click posterior puede pasar aunque React todavía no haya
  // re-renderizado con el estado de loading.
  const isConfirmandoRef = useRef(false);
  const [isConfirmando, setIsConfirmando] = useState(false);

  const handleConfirmClick = async () => {
    if (isConfirmandoRef.current || isLoading) return;
    isConfirmandoRef.current = true;
    setIsConfirmando(true);
    try {
      await onConfirm();
    } finally {
      isConfirmandoRef.current = false;
      setIsConfirmando(false);
    }
  };

  const bloqueado = isLoading || isConfirmando;

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

  const botones = (
    <>
      <Button variant={resolvedCancelVariant} onClick={onClose} disabled={bloqueado}>
        {cancelText}
      </Button>
      <Button
        variant={resolvedConfirmVariant}
        onClick={handleConfirmClick}
        disabled={bloqueado}
        isLoading={bloqueado}
      >
        {confirmText}
      </Button>
    </>
  );

  // Admin (variant="blue") usa el mismo esquema que cliente con los tonos
  // y botones de admin.
  const esAdmin = variant === "blue";
  const botonesAdmin = (
    <>
      <Button variant="adminNeutro" onClick={onClose} disabled={bloqueado}>
        {cancelText}
      </Button>
      <Button
        variant={isDanger ? "adminPeligro" : isWarning ? "adminAdvertencia" : "blue"}
        onClick={handleConfirmClick}
        disabled={bloqueado}
        isLoading={bloqueado}
      >
        {confirmText}
      </Button>
    </>
  );

  const iconoTile = icono || (isAlerta ? <FiAlertTriangle /> : <FiCheck />);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      variant="confirm"
      className={esAdmin ? styles.modalAdmin : ""}
      preventClose={preventClose || bloqueado}
    >
      <div
        ref={dialogRef}
        className={`${styles.cliente} ${esAdmin ? styles.admin : ""} ${isDanger ? styles.cDanger : isWarning ? styles.cWarning : styles.cNeutral}`}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.cHead}>
          <span className={styles.cTile} aria-hidden="true">{iconoTile}</span>
          <div className={styles.cTexto}>
            <h2 className={styles.cTitulo}>{titulo}</h2>
            <div className={styles.mensaje}>{mensaje}</div>
          </div>
        </div>

        {detalle && (
          <div className={styles.cDetalle}>
            {detalle.badge && <span className={styles.cDetalleBadge}>{detalle.badge}</span>}
            <span className={styles.cDetalleTexto}>
              <strong>{detalle.titulo}</strong>
              {detalle.subtitulo && <span>{detalle.subtitulo}</span>}
            </span>
          </div>
        )}

        <div className={styles.cAcciones}>{esAdmin ? botonesAdmin : botones}</div>
      </div>
    </Modal>
  );
}

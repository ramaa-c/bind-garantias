import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { PanelDudas } from "../../features";
import styles from "./HelpDrawer.module.css";

export function HelpDrawer({ isOpen, onClose, contexto, pasoActual }) {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} role="complementary" aria-label="Dudas frecuentes">
        <div className={styles.drawerHeader}>
          <div className={styles.drawerMeta}>
            <span className={styles.drawerBadge}>Centro de Ayuda</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <FiX size={15} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          <PanelDudas contexto={contexto} pasoActual={pasoActual} />
        </div>
      </aside>
    </div>,
    document.body
  );
}
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { PanelDudas } from "../../../features/shared/PanelDudas/PanelDudas";
import { ModalDudas } from "../../../features/shared/PanelDudas/ModalDudas";
import styles from "./HelpDrawer.module.css";

export function HelpDrawer({ isOpen, onClose, contexto, pasoActual }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.matchMedia("(max-width: 63.9rem)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (isMobile) {
    return createPortal(
      <ModalDudas
        isOpen={isOpen}
        onClose={onClose}
        contexto={contexto}
        pasoActual={pasoActual}
      />,
      document.body,
    );
  }
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside
        className={styles.drawer}
        role="complementary"
        aria-label="Dudas frecuentes"
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerMeta}>
            <span className={styles.drawerBadge}>Centro de Ayuda</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX size={15} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          <PanelDudas contexto={contexto} pasoActual={pasoActual} />
        </div>
      </aside>
    </div>,
    document.body,
  );
}

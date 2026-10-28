import React from "react";
import styles from "./PieModal.module.css";

// Pie de acciones para los modales de admin cuyo contenido es un formulario
// propio (no pueden usar la prop `footer` del Modal sin subir su estado):
// sangra de punta a punta del body y replica el pie del Modal.
export function PieModal({ children, ayuda }) {
  return (
    <div className={styles.pie}>
      {ayuda && <span className={styles.ayuda}>{ayuda}</span>}
      {children}
    </div>
  );
}

export default PieModal;

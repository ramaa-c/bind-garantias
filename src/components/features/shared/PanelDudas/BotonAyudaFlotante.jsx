import React, { useState } from "react";
import { FiHelpCircle } from "react-icons/fi";
import { ModalDudas } from "./ModalDudas";
import styles from "./BotonAyudaFlotante.module.css";

export const BotonAyudaFlotante = ({ contexto, pasoActual }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.fabContainer}>
      <button 
        className={styles.fabButton} 
        onClick={() => setIsModalOpen(true)}
        aria-label="Ayuda frecuente"
      >
        <FiHelpCircle className={styles.fabIcon} />
      </button>

      <ModalDudas 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        contexto={contexto} 
        pasoActual={pasoActual}
      />
    </div>
  );
};

import React from "react";
import { FiX } from "react-icons/fi";
import { ContenidoDudas } from "./ContenidoDudas";
import styles from "./ModalDudas.module.css";

export const ModalDudas = ({ isOpen, onClose }) => {

  return (
    <>
      <div 
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`} 
        onClick={onClose}
      />
      
      <div className={`${styles.bottomSheet} ${isOpen ? styles.bottomSheetOpen : ""}`}>
        <div className={styles.header}>
          <div className={styles.dragHandle} role="button" tabIndex={0} onClick={onClose}></div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        
        <div className={styles.contentScroll}>
          <ContenidoDudas />
        </div>
      </div>
    </>
  );
};

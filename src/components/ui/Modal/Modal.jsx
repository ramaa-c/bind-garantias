import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { useEscape } from '../../../hooks/useEscape';
import styles from './Modal.module.css';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px'
}) => {
  
  useEscape(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={onClose}
    >
      <div 
        className={styles.modalBox} 
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button 
          type="button"
          className={styles.closeButton} 
          onClick={onClose} 
          aria-label="Cerrar modal"
        >
          <FiX />
        </button>
        
        {title && <h2 className={styles.title}>{title}</h2>}
        
        <div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
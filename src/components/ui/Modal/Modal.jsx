import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import styles from './Modal.module.css';
import { useEscape } from '../../../hooks/useEscape';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px',
  overlayClassName,
  className,
  hideCloseButton = false,
  onMouseDown
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onClose) onClose();
    }
    if (onMouseDown) onMouseDown(e);
  };

  return createPortal(
    <div
      className={overlayClassName || styles.overlay}
      onMouseDown={handleOverlayClick}
    >
      <div 
        className={className || styles.modalBox}
        style={!className ? { maxWidth } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <FiX />
          </button>
        )}
        
        {title && <h2 className={styles.title}>{title}</h2>}
        
        {children}
      </div>
    </div>,
    document.body
  );
};

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { useEscape } from '../../../hooks/useEscape';
import styles from './Modal.module.css';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px',
  overlayClassName,
  modalClassName,
  hideCloseButton = false,
  onOverlayClick,
}) => {
  
  useEscape(onClose, isOpen);

  const modalRef = useRef(null);

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
    if (onOverlayClick) {
      onOverlayClick(e);
      return;
    }
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={overlayClassName || styles.overlay}
      onMouseDown={handleOverlayClick}
    >
      <div 
        className={modalClassName || styles.modalBox}
        style={modalClassName ? {} : { maxWidth }}
        ref={modalRef}
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
        
        <div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
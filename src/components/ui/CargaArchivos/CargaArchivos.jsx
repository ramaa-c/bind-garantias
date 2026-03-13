import React from 'react';
import styles from './CargaArchivos.module.css';
import { FiUploadCloud, FiFile, FiTrash2 } from 'react-icons/fi';
import { BotonIcono } from '../';

export const CargaArchivos = ({ 
  title = "Arrastrá tu archivo acá", 
  subtitle = "o hacé click para buscar", 
  file,
  isDragging, 
  onDrop, 
  onDragOver, 
  onDragLeave,
  onClick,
  onRemove
}) => {
  
  if (file) {
    return (
      <div className={`${styles.box} ${styles.loaded}`}>
        <div className={styles.loadedInfo}>
          <FiFile className={styles.loadedIcon} />
          <div className={styles.textGroup}>
            <span className={styles.filename}>{file.name}</span>
            {file.size && <span className={styles.filesize}>{file.size}</span>}
          </div>
        </div>
        
        {onRemove && (
          <BotonIcono icon={FiTrash2} variant="danger" onClick={onRemove} />
        )}
      </div>
    );
  }

  const boxClass = `${styles.box} ${isDragging ? styles.dragging : ''}`;

  return (
    <div 
      className={boxClass}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <FiUploadCloud className={styles.icon} />
      <h4 className={styles.text}>{title}</h4>
      <p className={styles.subtext}>{subtitle}</p>
    </div>
  );
};
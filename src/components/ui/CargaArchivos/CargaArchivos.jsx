import React from 'react';
import styles from './CargaArchivos.module.css';
import { FiUploadCloud, FiFile, FiTrash2, FiEye, FiDownload, FiEdit2 } from 'react-icons/fi';
import { BotonIcono } from "..//BotonIcono/BotonIcono";

export const CargaArchivos = ({ 
  title = "Arrastrá tu archivo acá", 
  subtitle = "o hacé click para buscar", 
  file,
  isDragging, 
  onDrop, 
  onDragOver, 
  onDragLeave,
  onClick,
  onEdit,
  onView,
  onDownload,
  hasError = false,
  className = "",
  style = {}
}) => {
  
  if (file) {
    return (
      <div className={`${styles.box} ${styles.loaded} ${className}`} style={style}>
        <div className={styles.loadedInfo}>
          <FiFile className={styles.loadedIcon} />
          <div className={styles.textGroup}>
            <span className={styles.filename}>{file.name}</span>
            {file.size && <span className={styles.filesize}>{file.size}</span>}
          </div>
        </div>
        
        <div className={styles.actionsGroup}>
          {onView && (
            <BotonIcono icon={FiEye} onClick={onView} title="Ver archivo" />
          )}
          {onDownload && (
            <BotonIcono icon={FiDownload} onClick={onDownload} title="Descargar archivo" />
          )}
          {onEdit && (
            <BotonIcono icon={FiEdit2} onClick={onEdit} title="Modificar archivo" />
          )}
        </div>
      </div>
    );
  }

  const boxClass = `${styles.box} ${isDragging ? styles.dragging : ""} ${hasError ? styles.error : ""} ${className}`;

  return (
    <div 
      className={boxClass}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <FiUploadCloud className={styles.icon} />
      <h4 className={styles.text}>{title}</h4>
      <p className={styles.subtext}>{subtitle}</p>
    </div>
  );
};

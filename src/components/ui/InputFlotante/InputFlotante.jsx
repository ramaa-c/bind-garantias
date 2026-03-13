import React, { useState } from 'react';
import styles from './InputFlotante.module.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaCheck } from 'react-icons/fa'; // <-- Agregamos el icono de éxito

export const InputFlotante = React.forwardRef(({ 
  label, 
  error, 
  esValido, // <-- Nueva prop para saber si pintarlo de verde
  type = 'text', 
  className = '', 
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`${styles.group} ${className}`}>
      <input
        type={currentType}
        // Le sumamos la clase isValid dinámicamente
        className={`${styles.input} ${esValido ? styles.isValid : ''}`}
        placeholder=" " 
        ref={ref}
        {...props}
      />
      <label className={styles.label}>{label}</label>

      {isPassword && (
        <button 
          type="button" 
          className={styles.toggleBtn} 
          onClick={() => setShowPassword(!showPassword)}
          tabIndex="-1"
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      )}

      {/* Mensaje de error original */}
      {error && <span className={styles.error}>{error}</span>}

      {/* NUEVO: Mensaje de éxito si es válido y no hay errores */}
      {esValido && !error && (
        <span className={styles.success}>
          <FaCheck size={12} style={{ marginRight: '4px' }} /> Válido
        </span>
      )}
    </div>
  );
});

InputFlotante.displayName = 'InputFlotante';
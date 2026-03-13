import React from 'react';
import styles from './SelectFlotante.module.css';
import { FiChevronDown } from 'react-icons/fi'; // Usamos un icono de flecha limpio

export const SelectFlotante = React.forwardRef(({ 
  label, 
  error, 
  options = [], 
  className = '', 
  ...props 
}, ref) => {

  console.log("¡Hola! Soy el nuevo SelectFlotante");
  return (
    <div className={`${styles.group} ${className}`}>
      <select
        className={styles.select}
        ref={ref}
        required // <--- ESTO ES CLAVE para que el CSS sepa si flotar el label o no
        {...props}
      >
        {/* Opción fantasma vacía para que arranque sin seleccionar y el label baje */}
        <option value="" disabled hidden></option>
        
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      
      <label className={styles.label}>{label}</label>
      <FiChevronDown className={styles.arrow} size={20} />

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});

SelectFlotante.displayName = 'SelectFlotante';
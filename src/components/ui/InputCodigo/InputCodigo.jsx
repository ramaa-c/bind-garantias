import React from 'react';
import styles from './InputCodigo.module.css';

export const InputCodigo = React.forwardRef(({ label, className = '', ...props }, ref) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type="text"
        className={styles.input}
        ref={ref}
        maxLength={6}
        {...props}
      />
    </div>
  );
});

InputCodigo.displayName = 'InputCodigo';
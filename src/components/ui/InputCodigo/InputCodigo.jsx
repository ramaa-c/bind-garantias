import React from 'react';
import styles from './InputCodigo.module.css';

export const InputCodigo = React.forwardRef(({ label, className = '', id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || props.name || generatedId;
  return (
    <div className={`${styles.container} ${className}`}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <input
        id={inputId}
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
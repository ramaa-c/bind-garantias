import React from 'react';
import styles from './Input.module.css';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  placeholder, 
  className = '', 
  as = 'input',
  centered = false,
  id,
  ...props 
}, ref) => {
  
  const Component = as;

  const generatedId = React.useId();
  const inputId = id || props.name || generatedId;

  const fieldClass = `
    ${styles.field} 
    ${error ? styles.fieldError : ''} 
    ${centered ? styles.centered : ''} 
    ${as === 'textarea' ? styles.textarea : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      
      <Component
        id={inputId}
        type={as === 'input' ? type : undefined}
        className={fieldClass}
        placeholder={placeholder}
        ref={ref}
        {...props}
      />

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
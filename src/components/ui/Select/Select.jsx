import React from 'react';
import styles from './Select.module.css';

export const Select = React.forwardRef(({ label, options, className = '', ...props }, ref) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={styles.field} ref={ref} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});

Select.displayName = 'Select';
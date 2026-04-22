import React from 'react';
import styles from './FormSection.module.css';

export const FormSection = ({ title, children }) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>{children}</div>
    </div>
  );
};

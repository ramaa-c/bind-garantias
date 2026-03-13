import React from 'react';
import styles from './Alert.module.css';
import { FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export const Alert = ({ 
  children, 
  variant = 'default',
  layout = 'box',
  icon: CustomIcon,
  className = ''
}) => {
  
  const getDefaultIcon = () => {
    switch (variant) {
      case 'warning': return FiAlertTriangle;
      case 'success': return FiCheckCircle;
      case 'error': return FiXCircle;
      default: return FiInfo;
    }
  };

  const IconToRender = CustomIcon || getDefaultIcon();

  const containerClass = `${styles.base} ${styles[layout]} ${styles[variant]} ${className}`;

  return (
    <div className={containerClass} role="alert">
      <IconToRender className={styles.icon} />
      <p className={styles.text}>{children}</p>
    </div>
  );
};
import React, { useState } from 'react';
import styles from './Acordeon.module.css';
import { FiChevronDown, FiCheckCircle, FiAlertCircle, FiClock, FiCircle } from 'react-icons/fi';

export const Acordeon = ({ 
  title, 
  subtitle, 
  status = 'default',
  defaultOpen = false,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getStatusConfig = () => {
    switch (status) {
      case 'check': return { Icon: FiCheckCircle, className: styles.statusCheck };
      case 'alert': return { Icon: FiAlertCircle, className: styles.statusAlert };
      case 'warn': return { Icon: FiClock, className: styles.statusWarn };
      default: return { Icon: FiCircle, className: styles.statusDefault };
    }
  };

  const { Icon: StatusIcon, className: statusClass } = getStatusConfig();

  return (
    <div className={styles.item}>
      <button 
        className={styles.header} 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className={styles.headerLeft}>
          <span className={`${styles.statusIcon} ${statusClass}`}>
            <StatusIcon />
          </span>
          <div className={styles.titleGroup}>
            <h4 className={styles.title}>{title}</h4>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        
        <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.body}>
          {children}
        </div>
      )}
    </div>
  );
};
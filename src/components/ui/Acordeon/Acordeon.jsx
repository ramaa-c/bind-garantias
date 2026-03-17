import React, { useState } from 'react';
import styles from './Acordeon.module.css';
import { FiChevronDown, FiCheckCircle, FiAlertCircle, FiClock, FiCircle } from 'react-icons/fi';

export const Acordeon = ({ 
  title, 
  subtitle, 
  status = 'default',
  isOpen: controlledIsOpen,
  defaultOpen = false,
  headerAction,
  onToggle,    
  children 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const getStatusConfig = () => {
    switch (status) {
      case 'check': return { Icon: FiCheckCircle, className: styles.statusCheck };
      case 'alert': return { Icon: FiAlertCircle, className: styles.statusAlert };
      case 'warn': return { Icon: FiClock, className: styles.statusWarn };
      default: return { Icon: FiCircle, className: styles.statusDefault };
    }
  };

  const { Icon: StatusIcon, className: statusClass } = getStatusConfig();

  const handleToggle = () => {
    const newState = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(newState);
    }
    if (onToggle) onToggle(newState); 
  };

  return (
    <div className={styles.item}>
      <div 
        className={styles.header} 
        onClick={handleToggle}
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
        
        <div className={styles.headerRight}>
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className={styles.body}>
          {children}
        </div>
      )}
    </div>
  );
};
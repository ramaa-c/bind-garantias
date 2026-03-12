import styles from './Badge.module.css';

export const Badge = ({ children, className = '' }) => {
  return (
    <span className={`${styles.badge} ${className}`}>
      {children}
    </span>
  );
};
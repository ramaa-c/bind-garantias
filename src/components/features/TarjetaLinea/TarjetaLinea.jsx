import styles from './TarjetaLinea.module.css';
import { FiChevronRight } from 'react-icons/fi';

export const TarjetaLinea = ({ title, description, isDisabled, onClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isDisabled && onClick) onClick();
    }
  };

  return (
    <div 
      className={`${styles.card} ${isDisabled ? styles.disabled : ''}`}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      onClick={!isDisabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.info}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.description}>{description}</p>
      </div>
      {!isDisabled && <FiChevronRight size={20} color="var(--yellow)" />}
    </div>
  );
};

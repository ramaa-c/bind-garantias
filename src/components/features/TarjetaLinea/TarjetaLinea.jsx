import styles from './TarjetaLinea.module.css';
import { FiChevronRight } from 'react-icons/fi';

export const TarjetaLinea = ({ title, description, isDisabled, onClick }) => {
  return (
    <div 
      className={`${styles.card} ${isDisabled ? styles.disabled : ''}`}
      onClick={!isDisabled ? onClick : undefined}
      role={onClick ? "button" : undefined}
    >
      <div className={styles.info}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.description}>{description}</p>
      </div>
      {!isDisabled && <FiChevronRight size={20} color="var(--yellow)" />}
    </div>
  );
};
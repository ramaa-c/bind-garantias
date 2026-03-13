import styles from './TarjetaSeleccionable.module.css';
import { FiCheckCircle } from 'react-icons/fi';

export const TarjetaSeleccionable = ({ title, icon: Icon, isSelected, onClick }) => {
  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.left}>
        {Icon && <span className={styles.icon}><Icon /></span>}
        <h4 className={styles.title}>{title}</h4>
      </div>
      
      <div className={styles.right}>
        {isSelected ? (
          <FiCheckCircle className={styles.circleSelected} />
        ) : (
          <div className={styles.circle} />
        )}
      </div>
    </div>
  );
};
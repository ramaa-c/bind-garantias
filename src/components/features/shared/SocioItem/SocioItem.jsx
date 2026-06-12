import { Avatar } from "../../../ui/Avatar/Avatar";
import { BotonIcono } from "../../../ui/BotonIcono/BotonIcono";
import { FiTrash2 } from 'react-icons/fi';
import styles from './SocioItem.module.css';

export const SocioItem = ({ name, cuit, onDelete }) => {
  return (
    <div className={styles.container}>
      <div className={styles.mainInfo}>
        <Avatar name={name} />
        <div className={styles.textGroup}>
          <h4 className={styles.name}>{name}</h4>
          <span className={styles.cuit}>CUIT: {cuit}</span>
        </div>
      </div>
      <BotonIcono 
        icon={FiTrash2} 
        variant="danger" 
        onClick={onDelete} 
      />
    </div>
  );
};
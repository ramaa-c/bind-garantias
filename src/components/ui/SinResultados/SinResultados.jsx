import styles from './SinResultados.module.css';
import { FiInbox } from 'react-icons/fi';

export const SinResultados = ({ message = "No hay elementos para mostrar", icon: Icon = FiInbox }) => {
  return (
    <div className={styles.container}>
      <Icon className={styles.icon} />
      <p className={styles.text}>{message}</p>
    </div>
  );
};
import styles from './ListaActividades.module.css';

export const ListaActividades = ({ icon: Icon, title, type, amount, status }) => {
  const statusClass = status.toLowerCase() === 'aprobado' 
    ? styles.statusAprobado 
    : styles.statusEsperando;

  return (
    <div className={styles.item}>
      <div className={styles.iconWrapper}>
        {Icon && <Icon />}
      </div>
      
      <div className={styles.details}>
        <h4 className={styles.title}>{title} <span>{type}</span></h4>
        <p className={styles.amount}>{amount}</p>
      </div>
      
      <div className={`${styles.status} ${statusClass}`}>
        {status}
      </div>
    </div>
  );
};
import styles from './TarjetaMetrica.module.css';

export const TarjetaMetrica = ({ icon: Icon, label, value }) => {
  return (
    <div className={styles.card}>
      {Icon && <Icon className={styles.icon} />}
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </div>
  );
};
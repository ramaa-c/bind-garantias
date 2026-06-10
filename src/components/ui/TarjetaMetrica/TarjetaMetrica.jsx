import styles from './TarjetaMetrica.module.css';

export const TarjetaMetrica = ({ icon: Icon, label, value, footer, className, labelClassName, valueClassName }) => {
  return (
    <div className={`${styles.card} ${className || ""}`}>
      {Icon && <Icon className={styles.icon} />}
      <p className={`${styles.label} ${labelClassName || ""}`}>{label}</p>
      <p className={`${styles.value} ${valueClassName || ""}`}>{value}</p>
      {footer}
    </div>
  );
};
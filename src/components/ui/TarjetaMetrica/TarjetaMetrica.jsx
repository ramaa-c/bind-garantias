import styles from './TarjetaMetrica.module.css';

export const TarjetaMetrica = ({ icon: Icon, label, value, footer, className, labelClassName, valueClassName, isLoading }) => {
  return (
    <div className={`${styles.card} ${className || ""}`}>
      {isLoading ? (
        <div className={styles.skeletonWrapper}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonIcon}`}></div>
          <p className={`${styles.label} ${labelClassName || ""}`}>{label}</p>
          <div className={`${styles.skeletonBlock} ${styles.skeletonValue}`}></div>
        </div>
      ) : (
        <>
          {Icon && <Icon className={styles.icon} />}
          <p className={`${styles.label} ${labelClassName || ""}`}>{label}</p>
          <p className={`${styles.value} ${valueClassName || ""}`}>{value}</p>
          {footer}
        </>
      )}
    </div>
  );
};
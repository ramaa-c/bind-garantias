import styles from "./TarjetaEstado.module.css";
import { FiCalendar } from "react-icons/fi";

export const TarjetaEstado = ({
  status = "waiting",
  statusLabel,
  date,
  title,
  subtitle,
  onPrimaryAction,
  primaryLabel = "Ver detalle",
  onSecondaryAction,
  secondaryLabel,
}) => {
  const cardClass = `${styles.card} ${styles[status]}`;

  return (
    <div className={cardClass}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <span className={styles.dot}></span>
          {statusLabel || status}
        </div>
        <div className={styles.date}>
          <FiCalendar /> {date}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.info}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.actions}>
          {onPrimaryAction && (
            <button type="button" className={styles.btnPrimary} onClick={onPrimaryAction}>
              {primaryLabel}
            </button>
          )}
          {onSecondaryAction && (
            <button type="button" className={styles.btnSecondary} onClick={onSecondaryAction}>
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

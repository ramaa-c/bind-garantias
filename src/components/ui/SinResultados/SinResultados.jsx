import styles from "./SinResultados.module.css";
import { FiInbox } from "react-icons/fi";
import { Button } from "../Button/Button";

export const SinResultados = ({
  title,
  message = "No hay elementos para mostrar",
  // eslint-disable-next-line no-unused-vars -- ESLint no rastrea el uso de este parámetro como tag JSX
  icon: Icon = FiInbox,
  actionLabel,
  onAction,
  variant = "default",
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${styles[variant] || ""} ${className}`}>
      <Icon className={styles.icon} />
      {title && <h4 className={styles.title}>{title}</h4>}
      <p className={styles.text}>{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className={styles.actionButton} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

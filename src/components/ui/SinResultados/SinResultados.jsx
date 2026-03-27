import styles from "./SinResultados.module.css";
import { FiInbox } from "react-icons/fi";

export const SinResultados = ({
  message = "No hay elementos para mostrar",
  // eslint-disable-next-line no-unused-vars
  icon: Icon = FiInbox,
}) => {
  return (
    <div className={styles.container}>
      <Icon className={styles.icon} />
      <p className={styles.text}>{message}</p>
    </div>
  );
};

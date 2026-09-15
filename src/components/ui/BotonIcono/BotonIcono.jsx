import { FiCheck } from "react-icons/fi";
import styles from "./BotonIcono.module.css";
import { Spinner } from "../Spinner/Spinner";

export const BotonIcono = ({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  onClick,
  variant = "default",
  className = "",
  title,
  isLoading = false,
  // Confirmación breve después de una acción instantánea (ver
  // useDescargaConFeedback): el ícono propio se reemplaza por un tilde.
  isDone = false,
}) => {
  return (
    <button
      className={`${styles.btnIcon} ${styles[variant]} ${isDone ? styles.done : ""} ${className}`}
      onClick={onClick}
      type="button"
      title={title}
      disabled={isLoading || isDone}
    >
      {isLoading ? (
        <Spinner size={16} />
      ) : isDone ? (
        <FiCheck size={18} />
      ) : (
        <Icon size={18} />
      )}
    </button>
  );
};

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
}) => {
  return (
    <button
      className={`${styles.btnIcon} ${styles[variant]} ${className}`}
      onClick={onClick}
      type="button"
      title={title}
      disabled={isLoading}
    >
      {isLoading ? <Spinner size={16} /> : <Icon size={18} />}
    </button>
  );
};

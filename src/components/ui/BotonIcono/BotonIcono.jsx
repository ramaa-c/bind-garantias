import styles from "./BotonIcono.module.css";

export const BotonIcono = ({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  onClick,
  variant = "default",
  className = "",
}) => {
  return (
    <button
      className={`${styles.btnIcon} ${styles[variant]} ${className}`}
      onClick={onClick}
      type="button"
    >
      <Icon size={18} />
    </button>
  );
};

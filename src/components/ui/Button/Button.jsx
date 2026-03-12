import styles from "./Button.module.css";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  const buttonClass = `${styles[variant]} ${size === "lg" ? styles["size-lg"] : ""} ${className}`;

  return (
    <button className={buttonClass} onClick={onClick} type={type} {...props}>
      {children}
    </button>
  );
};

import React from "react";
import styles from "./Button.module.css";

export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  iconRight,
  ...props
}) => {
  const claseBoton = `
    ${styles[variant] || styles.primary} 
    ${styles[`size-${size}`] || ""} 
    ${iconRight ? styles.hasIconRight : ""} 
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={claseBoton}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {iconRight ? (
        <>
          <span className={styles.textContainer}>{children}</span>
          <span className={styles.iconContainer}>{iconRight}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

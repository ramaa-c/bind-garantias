import React from "react";
import styles from "./Button.module.css";

export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
}) => {
  const claseBoton = `
    ${styles[variant] || styles.primary} 
    ${styles[`size-${size}`] || ""} 
    ${className}
  `.trim();

  return (
    <button type={type} className={claseBoton} onClick={onClick}>
      {children}
    </button>
  );
};

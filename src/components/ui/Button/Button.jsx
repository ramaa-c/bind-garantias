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
  isLoading,
  ...props
}) => {
  const claseBoton = `
    ${styles[variant] || styles.primary} 
    ${styles[`size-${size}`] || ""} 
    ${iconRight ? styles.hasIconRight : ""} 
    ${isLoading ? styles.loading : ""}
    ${className}
  `.trim();

  const renderContent = () => {
    if (isLoading && typeof children === "string" && children.endsWith("...")) {
      const textWithoutDots = children.slice(0, -3);
      return (
        <>
          {textWithoutDots}
          <span className={styles.dots}>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
          </span>
        </>
      );
    }

    if (iconRight) {
      return (
        <>
          <span className={styles.textContainer}>{children}</span>
          <span className={styles.iconContainer}>{iconRight}</span>
        </>
      );
    }

    return children;
  };

  return (
    <button
      type={type}
      className={claseBoton}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && !String(children).endsWith("...") && <span className={styles.spinner} />}
      <span className={isLoading ? styles.loadingText : ""}>
        {renderContent()}
      </span>
    </button>
  );
};

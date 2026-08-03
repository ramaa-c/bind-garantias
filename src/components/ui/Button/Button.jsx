import React, { useRef } from "react";
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
  const btnRef = useRef(null);

  const claseBoton = `
    ${styles[variant] || styles.primary} 
    ${styles[`size-${size}`] || ""} 
    ${iconRight ? styles.hasIconRight : ""} 
    ${isLoading ? styles.loading : ""}
    ${className}
  `.trim();

  const handleClick = (e) => {
    if (disabled || isLoading) return;

    const btn = btnRef.current;
    if (!btn) return;

    const ripple = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.className = styles.ripple;
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());

    onClick?.(e);
  };

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
      ref={btnRef}
      type={type}
      className={claseBoton}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && !String(children).endsWith("...") && (
        <span className={styles.spinnerWrap}>
          <span className={styles.spinner} />
        </span>
      )}
      {isLoading ? (
        <span className={styles.loadingText}>{renderContent()}</span>
      ) : (
        renderContent()
      )}
    </button>
  );
};

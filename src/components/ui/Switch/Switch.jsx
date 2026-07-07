import React from "react";
import styles from "./Switch.module.css";

export const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  variant = "admin",
  size = "md",
  label,
  id,
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  return (
    <label className={`${styles.wrapper} ${disabled ? styles.disabled : ""}`} htmlFor={id}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`${styles.track} ${styles[variant] || styles.admin} ${styles[size] || styles.md} ${checked ? styles.checked : ""}`}
        onClick={handleToggle}
      >
        <span className={styles.thumb} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
};

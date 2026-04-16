import React, { useState } from "react";
import styles from "./InputFlotante.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";

export const InputFlotante = React.forwardRef(
  (
    {
      label,
      error,
      esValido,
      icon,
      type = "text",
      className = "",
      id,
      compact = false,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword && showPassword ? "text" : type;
    const inputId = id || props.name || generatedId;

    return (
      <div
        className={`${styles.group} ${compact ? styles.compact : ""} ${icon ? styles.hasIcon : ""} ${className}`}
      >
        <input
          id={inputId}
          type={currentType}
          className={`${styles.input} ${esValido ? styles.isValid : ""}`}
          placeholder=" "
          ref={ref}
          {...props}
        />

        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>

        {icon && <span className={styles.icon}>{icon}</span>}

        {isPassword && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}

        {error && <span className={styles.error}>{error}</span>}

        {esValido && !error && (
          <span className={styles.success}>
            <FaCheck size={12} style={{ marginRight: "4px" }} /> Válido
          </span>
        )}
      </div>
    );
  },
);

InputFlotante.displayName = "InputFlotante";

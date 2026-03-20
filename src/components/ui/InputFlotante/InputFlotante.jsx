import React, { useState } from "react";
import styles from "./InputFlotante.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";

export const InputFlotante = React.forwardRef(
  (
    { label, error, esValido, type = "text", className = "", ...props },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword && showPassword ? "text" : type;

    return (
      <div className={`${styles.group} ${className}`}>
        <input
          type={currentType}
          className={`${styles.input} ${esValido ? styles.isValid : ""}`}
          placeholder=" "
          ref={ref}
          {...props}
        />

        <label className={styles.label}>{label}</label>

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

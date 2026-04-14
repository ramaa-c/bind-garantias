import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";
import { getPasswordScore } from "../../../utils/PasswordSeguro";
import styles from "./InputPasswordSeguro.module.css";

export const InputPasswordSeguro = React.forwardRef(
  (
    {
      label,
      currentValue = "",
      email = "",
      esValido,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || props.name || generatedId;

    const getStrength = (pass) => {
      if (!pass) return { width: "0%", color: "transparent", mensaje: "" };

      const scoreZxcvbn = getPasswordScore(pass, email);

      const hasLength = pass.length >= 12;
      const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(pass);
      const hasNumber = /[0-9]/.test(pass);
      const hasSymbol = /[!_.*@#$%^&()\-+]/.test(pass);

      const faltantes = [];
      if (!hasLength) faltantes.push("12 caracteres mínimo");
      else if (!hasUpperLower) faltantes.push("mayúsculas y minúsculas");
      else if (!hasNumber) faltantes.push("algún número");
      else if (!hasSymbol) faltantes.push("algún símbolo (!_.*)");

      if (faltantes.length > 0) {
        const visualScore = Math.min(scoreZxcvbn, 2);

        if (visualScore <= 1) {
          return {
            width: "25%",
            color: "#ff5252",
            mensaje: `Débil. Falta: ${faltantes[0]}`,
          };
        } else {
          return {
            width: "50%",
            color: "#ffb142",
            mensaje: `Casi. Falta: ${faltantes[0]}`,
          };
        }
      }

      if (scoreZxcvbn < 3) {
        return {
          width: "75%",
          color: "#2196f3",
          mensaje: "Cumple los requisitos, pero es muy adivinable.",
        };
      }

      return { width: "100%", color: "#4caf50", mensaje: "Contraseña segura." };
    };

    const { width, color, mensaje } = getStrength(currentValue);

    return (
      <div className={`${styles.group} ${className}`}>
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={styles.input}
          placeholder=" "
          ref={ref}
          {...props}
        />
        <label htmlFor={inputId} className={styles.label}>{label}</label>

        {esValido && (
          <span className={styles.successIcon}>
            <FaCheck size={14} />
          </span>
        )}

        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setShowPassword(!showPassword)}
          tabIndex="-1"
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>

        <div
          className={styles.strengthBar}
          style={{ width, backgroundColor: color }}
        ></div>

        {currentValue && (
          <p className={styles.feedbackText} style={{ color }}>
            {mensaje}
          </p>
        )}
      </div>
    );
  },
);

InputPasswordSeguro.displayName = "InputPasswordSeguro";

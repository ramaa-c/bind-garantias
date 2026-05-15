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
      value,
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

      return { width: "100%", color: "var(--success-green, #3ddc84)", mensaje: "Contraseña segura." };
    };

    const { width, color, mensaje } = getStrength(currentValue);
    const dynamicColor = currentValue ? color : 'var(--yellow, #f5f400)';

    return (
      <div className={`${styles.group} ${className}`} style={{ '--dynamic-color': dynamicColor }}>
        <div className={styles.inputWrapper}>
          <input
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={styles.input}
            placeholder=" "
            ref={ref}
            value={value !== undefined ? value : ""}
            {...props}
          />
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>

          <div className={styles.actions}>
            {esValido && (
              <span className={styles.successIcon}>
                <FaCheck size={12} />
              </span>
            )}
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
            </button>
          </div>

          <div className={styles.strengthTrack}>
            <div
              className={styles.strengthFill}
              style={{ width, backgroundColor: color }}
            />
          </div>
        </div>

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

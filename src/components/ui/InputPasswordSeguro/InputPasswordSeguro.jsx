import React, { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";
import {
  getPasswordScore,
  precargarZxcvbn,
} from "../../../utils/PasswordSeguro";
import styles from "./InputPasswordSeguro.module.css";

const REQUIREMENTS = [
  { id: "length", label: "12 caracteres mínimo", test: (v) => v.length >= 12 },
  { id: "upper", label: "Una letra mayúscula", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Una letra minúscula", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "Un número", test: (v) => /[0-9]/.test(v) },
  {
    id: "symbol",
    label: "Un símbolo (!_.*@#$%^&()-+)",
    test: (v) => /[!_.*@#$%^&()\-+]/.test(v),
  },
];

export const InputPasswordSeguro = React.forwardRef(
  (
    {
      label,
      currentValue = "",
      email = "",
      esValido,
      className = "",
      theme = "yellow",
      id,
      value,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const [showPassword, setShowPassword] = useState(false);
    const [, setZxcvbnListo] = useState(false);
    const inputId = id || props.name || generatedId;

    useEffect(() => {
      precargarZxcvbn().then(() => setZxcvbnListo(true));
    }, []);

    const getStrength = (pass) => {
      if (!pass) return { width: "0%", color: "transparent" };

      const scoreZxcvbn = getPasswordScore(pass, email);
      const metCount = REQUIREMENTS.filter((r) => r.test(pass)).length;
      const allMet = metCount === REQUIREMENTS.length;

      if (allMet) {
        if (scoreZxcvbn < 3) {
          return { width: "75%", color: "#2196f3" };
        }
        return { width: "100%", color: "var(--success-green, #3ddc84)" };
      }

      const pct = (metCount / REQUIREMENTS.length) * 100;
      if (metCount <= 1)
        return { width: `${Math.max(pct, 20)}%`, color: "var(--danger-bright)" };
      if (metCount <= 2) return { width: `${pct}%`, color: "#ffb142" };
      return { width: `${pct}%`, color: "#2196f3" };
    };

    const { width, color } = getStrength(currentValue);
    const defaultColor = theme === "blue" ? "var(--color-azul-bind)" : "var(--yellow, #f5f400)";
    const dynamicColor = currentValue ? color : defaultColor;

    return (
      <div
        className={`${styles.group} ${className}`}
        style={{ "--dynamic-color": dynamicColor }}
      >
        <div
          className={`${styles.inputWrapper} ${
            currentValue && REQUIREMENTS.every((r) => r.test(currentValue))
              ? styles.isValid
              : ""
          }`}
        >
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

        {/* ── REQUIREMENTS LIST ── */}
        <div
          className={styles.requirements}
          aria-live="polite"
          aria-label="Requisitos de contraseña"
        >
          {REQUIREMENTS.map((req) => {
            const met = req.test(currentValue);
            const active = !met && currentValue.length > 0;
            return (
              <div
                key={req.id}
                className={`${styles.reqItem} ${met ? styles.reqMet : ""} ${
                  active ? styles.reqActive : ""
                }`}
              >
                <span className={styles.reqIcon} aria-hidden="true">
                  <FaCheck size={8} />
                </span>
                <span className={styles.reqText}>{req.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

InputPasswordSeguro.displayName = "InputPasswordSeguro";
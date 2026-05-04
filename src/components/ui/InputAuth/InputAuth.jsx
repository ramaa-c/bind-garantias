import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./InputAuth.module.css";

export const InputAuth = ({
  control,
  name,
  label,
  icon,
  type = "text",
  error,
  esValido,
  hideError = false,
  className = "",
  defaultValue = "",
  value: manualValue,
  onChange: manualOnChange,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword && showPassword ? "text" : type;

  const renderInput = (val, onCh, ref, fieldError) => {
    const hasError = !!(error || fieldError);
    const errorMessage = error || fieldError?.message;

    return (
      <div
        className={`${styles.container} ${hasError ? styles.hasError : ""} ${
          !hasError && esValido ? styles.isValid : ""
        } ${className}`}
      >
        <div className={styles.innerGroup}>
          {icon && <div className={styles.icon}>{icon}</div>}

          <div className={styles.fieldGroup}>
            <input
              type={currentType}
              value={val || ""}
              onChange={(e) => {
                if (onCh) onCh(e.target.value);
              }}
              className={`${styles.input} ${isPassword ? styles.inputWithToggle : ""}`}
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
          </div>
        </div>

        {hasError && !hideError && <span className={styles.errorMsg}>{errorMessage}</span>}
      </div>
    );
  };

  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field: { onChange, value, ref }, fieldState }) => {
          return renderInput(value, onChange, ref, fieldState.error);
        }}
      />
    );
  }

  return renderInput(manualValue, manualOnChange, null, null);
};

InputAuth.displayName = "InputAuth";

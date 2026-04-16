import React from "react";
import { Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import styles from "./InputSocioMasked.module.css";

export const InputSocioMasked = ({
  control,
  name,
  label,
  icon,
  mask,
  error,
  esValido,
  className = "",
  defaultValue = "",
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, ref }, fieldState }) => {
        const hasError = !!(error || fieldState.error);
        const errorMessage = error || fieldState.error?.message;

        return (
          <div
            className={`${styles.container} ${hasError ? styles.hasError : ""} ${!hasError && esValido ? styles.isValid : ""} ${className}`}
          >
            <div className={styles.innerGroup}>
              {icon && <div className={styles.icon}>{icon}</div>}

              <div className={styles.fieldGroup}>
                {mask ? (
                  <IMaskInput
                    mask={mask}
                    value={value?.toString() || ""}
                    unmask={true}
                    onAccept={(unmaskedValue) => {
                      onChange(unmaskedValue);
                    }}
                    className={styles.input}
                    placeholder=" "
                    inputRef={ref}
                    {...props}
                  />
                ) : (
                  <input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={styles.input}
                    placeholder=" "
                    ref={ref}
                    {...props}
                  />
                )}
                <label className={styles.label}>{label}</label>
              </div>

            </div>

            {hasError && (
              <span className={styles.errorMsg}>{errorMessage}</span>
            )}
          </div>
        );
      }}
    />
  );
};

InputSocioMasked.displayName = "InputSocioMasked";

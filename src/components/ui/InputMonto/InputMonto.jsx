import React from "react";
import { Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import styles from "./InputMonto.module.css";

export const InputMonto = ({
  control,
  name,
  label,
  error,
  currency = "$",
  esValido,
  id,
  className = "",
  ...props
}) => {
  const inputId = id || name;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field: { onChange, value, ref }, fieldState }) => {
        const hasError = !!(error || fieldState.error);
        const errorMessage = error || fieldState.error?.message;

        return (
          <div className={`${styles.wrapper} ${className}`}>
            {label && (
              <label htmlFor={inputId} className={styles.label}>
                {label}
              </label>
            )}

            <div
              className={`
                ${styles.container} 
                ${!hasError && esValido ? styles.valid : ""} 
                ${hasError ? styles.invalid : ""}
              `}
            >
              <span className={styles.currency} aria-hidden="true">
                {currency}
              </span>

              <IMaskInput
                id={inputId}
                mask={Number}
                scale={2}
                thousandsSeparator="."
                radix=","
                padFractionalZeros={true}
                normalizeZeros={true}
                unmask={true}
                value={value?.toString() || ""}
                onAccept={(unmaskedValue) => {
                  const numValue =
                    unmaskedValue === "" ? "" : Number(unmaskedValue);
                  onChange(numValue);
                }}
                inputMode="numeric"
                className={styles.input}
                placeholder="0"
                inputRef={ref}
                autoComplete="off"
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
                {...props}
              />
            </div>

            {hasError && (
              <span id={errorId} className={styles.error} role="alert">
                {errorMessage}
              </span>
            )}
          </div>
        );
      }}
    />
  );
};

InputMonto.displayName = "InputMonto";
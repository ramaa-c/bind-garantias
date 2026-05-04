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
  value: manualValue,
  onChange: manualOnChange,
  ...props
}) => {
  const renderInput = (val, onCh, ref, fieldError) => {
    const hasError = !!(error || fieldError);
    const errorMessage = error || fieldError?.message;

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
                value={val?.toString() || ""}
                unmask={true}
                onAccept={(unmaskedValue) => {
                  if (onCh) onCh(unmaskedValue);
                }}
                className={styles.input}
                placeholder=" "
                inputRef={ref}
                {...props}
              />
            ) : (
              <input
                value={val || ""}
                onChange={(e) => {
                  if (onCh) onCh(e.target.value);
                }}
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

InputSocioMasked.displayName = "InputSocioMasked";

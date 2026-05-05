import React, { useState } from "react";
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
  onFocus: manualOnFocus,
  onBlur: manualOnBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderInput = (val, onCh, ref, fieldError) => {
    const hasError = !!(error || fieldError);
    const errorMessage = error || fieldError?.message;
    const hasValue =
      val !== undefined && val !== null && String(val).length > 0;

    let statusClass = styles.statusDefault;
    if (hasError) {
      statusClass = styles.statusError;
    } else if (isFocused) {
      statusClass = styles.statusFocus;
    } else if (esValido) {
      statusClass = styles.statusSuccess;
    }

    const containerClasses = [
      styles.container,
      statusClass,
      hasValue || isFocused ? styles.hasValue : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleFocus = (e) => {
      setIsFocused(true);
      if (manualOnFocus) manualOnFocus(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      if (manualOnBlur) manualOnBlur(e);
    };

    return (
      <div className={containerClasses}>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={styles.input}
                placeholder=" "
                ref={ref}
                {...props}
              />
            )}
            <label className={styles.label}>{label}</label>
          </div>
        </div>

        {hasError && <span className={styles.errorMsg}>{errorMessage}</span>}
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

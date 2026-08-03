import React, { useState, forwardRef } from "react";
import { Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { FiInfo } from "react-icons/fi";
import styles from "./InputSocioMasked.module.css";

export const InputSocioMasked = forwardRef(({
  control,
  name,
  label,
  icon,
  mask,
  error,
  esValido,
  tooltip,
  className = "",
  defaultValue = "",
  disabled = false,
  value: manualValue,
  onChange: manualOnChange,
  onFocus: manualOnFocus,
  onBlur: manualOnBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderInput = (val, onCh, inputRef, fieldError) => {
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
      disabled ? styles.isDisabled : "",
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
                inputRef={inputRef}
                disabled={disabled}
                {...props}
              />
            ) : (
              <input
                value={val !== undefined && val !== null ? val : ""}
                onChange={(e) => {
                  if (onCh) onCh(e.target.value);
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={styles.input}
                placeholder=" "
                ref={inputRef}
                disabled={disabled}
                {...props}
              />
            )}
            <label className={styles.label}>{label}</label>
          </div>

          {tooltip && (
            <div className={styles.helpIconContainer}>
              <FiInfo className={styles.helpIcon} />
              <div className={styles.tooltipBubble}>
                {tooltip}
              </div>
            </div>
          )}
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
        render={({ field: { onChange, value, ref: fieldRef }, fieldState }) => {
          return renderInput(value, onChange, fieldRef || ref, fieldState.error);
        }}
      />
    );
  }

  return renderInput(manualValue, manualOnChange, ref, null);
});

InputSocioMasked.displayName = "InputSocioMasked";
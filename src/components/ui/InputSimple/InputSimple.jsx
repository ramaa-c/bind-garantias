import React, { useState, forwardRef } from "react";
import { Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";
import styles from "./InputSimple.module.css";

export const InputSimple = forwardRef(({
  control,
  name,
  label,
  type = "text",
  error,
  esValido,
  className = "",
  defaultValue = "",
  value: manualValue,
  onChange: manualOnChange,
  onFocus: manualOnFocus,
  onBlur: manualOnBlur,
  variant,
  mask,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = React.useId();
  const inputId = props.id || name || generatedId;

  const isPasswordType = type === "password";
  const currentType = isPasswordType && showPassword ? "text" : type;

  const renderInput = (val, onCh, inputRef, fieldError) => {
    const hasError = !!(error || fieldError);
    const errorMessage = error?.message || (typeof error === 'string' ? error : null) || fieldError?.message;
    const hasValue = val !== undefined && val !== null && String(val).length > 0;

    const isAdmin = variant === "admin" || (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));

    let statusClass = styles.statusDefault;
    if (hasError) {
      statusClass = styles.statusError;
    } else if (isFocused) {
      statusClass = styles.statusFocus;
    } else if (esValido) {
      statusClass = styles.statusSuccess;
    }

    const containerClasses = [
      styles.group,
      statusClass,
      hasValue || isFocused ? styles.hasValue : "",
      isAdmin ? styles.adminVariant : "",
      className,
    ].filter(Boolean).join(" ");

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
        <div className={styles.inputWrapper}>
          {mask ? (
            <IMaskInput
              id={inputId}
              mask={mask}
              className={styles.input}
              placeholder=" "
              value={val ? String(val) : ""}
              onAccept={(value, maskRef) => {
                if (onCh) onCh(value);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              inputRef={inputRef}
              {...props}
            />
          ) : (
            <input
              id={inputId}
              type={currentType}
              className={styles.input}
              placeholder=" "
              value={val || ""}
              onChange={(e) => {
                if (onCh) onCh(e.target.value);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              ref={inputRef}
              {...props}
            />
          )}
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>

          <div className={styles.actions}>
            {esValido && (
              <span className={styles.successIcon}>
                <FaCheck size={12} />
              </span>
            )}
            {isPasswordType && (
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            )}
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
        render={({ field: { onChange, value, ref: fieldRef }, fieldState }) => {
          return renderInput(value, onChange, fieldRef || ref, fieldState.error);
        }}
      />
    );
  }

  return renderInput(manualValue, manualOnChange, ref, null);
});

InputSimple.displayName = "InputSimple";
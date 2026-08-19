import React, { useState, useRef, forwardRef } from "react";
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
  hideErrorSpace = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = React.useId();
  const inputId = props.id || name || generatedId;
  const lastAcceptedRef = useRef(undefined);

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
      hideErrorSpace ? styles.noErrorSpace : "",
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
        <div className={`${styles.inputWrapper} ${type === "textarea" ? styles.textareaWrapper : ""}`}>
          {mask ? (
            <IMaskInput
              id={inputId}
              mask={mask}
              className={styles.input}
              placeholder=" "
              // react-imask reasigna maskRef.value en CADA render (no solo
              // cuando "value" cambia de verdad), y esa reasignación pasa
              // por el setter completo del mask, que con padFractionalZeros
              // commitea el número parcial tipeado hasta ese momento (ej:
              // tipear "50000" queda paddeado a "5,00" en el primer dígito y
              // los siguientes se pierden). Si lo que llega en "val" es
              // exactamente lo último que este mismo campo emitió por
              // onAccept, no es un cambio externo real (precarga/reset):
              // se omite el value para que react-imask no fuerce esa
              // reasignación y no interrumpa el tipeo en curso.
              value={
                val !== undefined &&
                val !== null &&
                String(val) === lastAcceptedRef.current
                  ? undefined
                  : val
                    ? String(val)
                    : ""
              }
              onAccept={(value) => {
                lastAcceptedRef.current = value;
                if (onCh) onCh(value);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              inputRef={inputRef}
              {...props}
            />
          ) : type === "textarea" ? (
            <textarea
              id={inputId}
              className={`${styles.input} ${styles.textarea}`}
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
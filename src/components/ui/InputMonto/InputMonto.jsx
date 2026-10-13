import React, { useRef } from "react";
import { Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { FiLock } from "react-icons/fi";
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
  locked = false,
  lockedMessage,
  ...props
}) => {
  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const lastAcceptedRef = useRef(undefined);

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
              <div className={styles.labelRow}>
                <label htmlFor={inputId} className={styles.label}>
                  {label}
                </label>
                {locked && (
                  <span className={styles.lockedBadge}>
                    <FiLock className={styles.lockedBadgeIcon} aria-hidden="true" />
                    Monto fijo
                  </span>
                )}
              </div>
            )}

            <div
              className={`
                ${styles.container}
                ${!hasError && esValido ? styles.valid : ""}
                ${hasError ? styles.invalid : ""}
                ${locked ? styles.lockedContainer : ""}
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
                // react-imask reasigna maskRef.unmaskedValue en CADA render
                // (no solo cuando el valor cambia de verdad de afuera), y esa
                // reasignación pasa por el setter completo del mask, que con
                // padFractionalZeros commitea el número parcial tipeado hasta
                // ese momento (ej: tipear "50000" queda paddeado a "5,00" en
                // el primer dígito y los siguientes se pierden). Si lo que
                // llega en "value" es exactamente lo último que este mismo
                // campo emitió por onAccept, no es un cambio externo real
                // (precarga/reset): se omite el value para que react-imask
                // no fuerce esa reasignación y no interrumpa el tipeo.
                value={
                  value !== undefined &&
                  value !== null &&
                  String(value) === lastAcceptedRef.current
                    ? undefined
                    : value?.toString() || ""
                }
                onAccept={(unmaskedValue) => {
                  const numValue =
                    unmaskedValue === "" ? "" : Number(unmaskedValue);
                  lastAcceptedRef.current = String(numValue);
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

              {locked && (
                <FiLock className={styles.lockIcon} aria-hidden="true" />
              )}
            </div>

            {hasError ? (
              <span id={errorId} className={styles.error} role="alert">
                {errorMessage}
              </span>
            ) : (
              locked &&
              lockedMessage && <p className={styles.hint}>{lockedMessage}</p>
            )}
          </div>
        );
      }}
    />
  );
};

InputMonto.displayName = "InputMonto";
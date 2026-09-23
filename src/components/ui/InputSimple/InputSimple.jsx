import React, { useState, forwardRef } from "react";
import { Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";
import styles from "./InputSimple.module.css";

// Componente aparte, con identidad estable entre renders de InputSimple, que
// recibe el ref vía forwardRef (la forma soportada por el compiler) en vez de
// como parámetro de una función interna - eso último es lo que dispara
// react-hooks/refs, porque el compiler no puede garantizar que una función
// cualquiera no lea ref.current durante el render.
const InputSimpleField = forwardRef(function InputSimpleField(
  {
    val,
    onCh,
    fieldError,
    error,
    esValido,
    className,
    variant,
    hideErrorSpace,
    sinIconos,
    type,
    mask,
    label,
    inputId,
    isFocused,
    setIsFocused,
    showPassword,
    setShowPassword,
    manualOnFocus,
    manualOnBlur,
    ...props
  },
  inputRef,
) {
  const [lastAccepted, setLastAccepted] = useState(undefined);
  const isPasswordType = type === "password";
  const currentType = isPasswordType && showPassword ? "text" : type;

  const hasError = !!(error || fieldError);
  const errorMessage = error?.message || (typeof error === "string" ? error : null) || fieldError?.message;
  const hasValue = val !== undefined && val !== null && String(val).length > 0;

  const isAdmin = variant === "admin" || (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));

  let statusClass = styles.statusDefault;
  if (hasError) {
    statusClass = styles.statusError;
  } else if (esValido) {
    statusClass = styles.statusSuccess;
  } else if (isFocused) {
    statusClass = styles.statusFocus;
  }

  // El padding-right grande (ver .sinIconos en InputSimple.module.css) solo
  // hace falta cuando .actions va a mostrar algo de verdad (el tilde de
  // válido, o el ojito de mostrar/ocultar contraseña) - si ninguno de los
  // dos aplica, ese hueco reservado no cumple ningún propósito y le come
  // espacio real al valor tipeado (reportado el 2026-09-22 en el CUIT de
  // prueba de CdaWorkbench, pero "sinIconos" era opt-in por campo: pasaba
  // en cualquier input de la app al que no se le hubiera puesto el flag a
  // mano). Auto-detectado acá en vez de a mano por campo: no cambia nada en
  // los inputs que SÍ muestran algo en .actions (siguen con el padding
  // ancho), solo angosta los que de verdad no lo necesitan.
  const sinAccionesVisibles = !esValido && !isPasswordType;

  const containerClasses = [
    styles.group,
    statusClass,
    hasValue || isFocused ? styles.hasValue : "",
    isAdmin ? styles.adminVariant : "",
    hideErrorSpace ? styles.noErrorSpace : "",
    sinIconos || sinAccionesVisibles ? styles.sinIconos : "",
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
            autoComplete="off"
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
              String(val) === lastAccepted
                ? undefined
                : val
                  ? String(val)
                  : ""
            }
            onAccept={(value) => {
              setLastAccepted(value);
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
            autoComplete="off"
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
            autoComplete="off"
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
});

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
  sinIconos = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = React.useId();
  const inputId = props.id || name || generatedId;

  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field: { onChange, value, ref: fieldRef }, fieldState }) => (
          <InputSimpleField
            ref={fieldRef || ref}
            val={value}
            onCh={onChange}
            fieldError={fieldState.error}
            error={error}
            esValido={esValido}
            className={className}
            variant={variant}
            hideErrorSpace={hideErrorSpace}
            sinIconos={sinIconos}
            type={type}
            mask={mask}
            label={label}
            inputId={inputId}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            manualOnFocus={manualOnFocus}
            manualOnBlur={manualOnBlur}
            {...props}
          />
        )}
      />
    );
  }

  return (
    <InputSimpleField
      ref={ref}
      val={manualValue}
      onCh={manualOnChange}
      fieldError={null}
      error={error}
      esValido={esValido}
      className={className}
      variant={variant}
      hideErrorSpace={hideErrorSpace}
      sinIconos={sinIconos}
      type={type}
      mask={mask}
      label={label}
      inputId={inputId}
      isFocused={isFocused}
      setIsFocused={setIsFocused}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      manualOnFocus={manualOnFocus}
      manualOnBlur={manualOnBlur}
      {...props}
    />
  );
});

InputSimple.displayName = "InputSimple";

import React, { forwardRef } from "react";
import { FiCreditCard } from "react-icons/fi";
import { InputSocioMasked } from "../../ui/InputSocioMasked/InputSocioMasked";
import { Button } from "../../ui/Button/Button";
import styles from "./BuscadorCuit.module.css";

export const BuscadorCuit = forwardRef(({
  label = "CUIT / CUIL",
  onValidar,
  error,
  esValido,
  isLoading = false,
  disabled = false,
  buttonText = "VALIDAR CUIT",
  value,
  onChange,
  inline = false,
  ...rest
}, ref) => {
  const boton = (
    <Button
      type="button"
      variant="primary"
      onClick={onValidar}
      disabled={!esValido || disabled}
      isLoading={isLoading}
      className={inline ? styles.inlineBtn : styles.actionBtn}
    >
      {isLoading ? "BUSCANDO..." : buttonText}
    </Button>
  );

  return (
    <div className={`${styles.container} ${inline ? styles.containerInline : ""}`}>
      <div className={styles.inputWrapper}>
        <InputSocioMasked
          ref={ref}
          label={label}
          type="text"
          mask="00-00000000-0"
          icon={<FiCreditCard />}
          esValido={esValido}
          error={error}
          disabled={isLoading || disabled}
          size={inline ? "lg" : undefined}
          endAdornment={inline ? boton : undefined}
          value={value}
          onChange={(val) => {
            // Aseguramos que siempre viaje el valor limpio (solo números) de 11 dígitos
            const limpio = val ? String(val).replace(/\D/g, "").slice(0, 11) : "";

            if (onChange) {
              onChange({ target: { value: limpio } });
            }
          }}
          {...rest}
        />
      </div>

      {!inline && <div className={styles.buttonWrapper}>{boton}</div>}
    </div>
  );
});
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
  buttonText = "VALIDAR CUIT",
  value,
  onChange,
  ...rest
}, ref) => {
  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <InputSocioMasked
          ref={ref}
          label={label}
          type="text"
          mask="00-00000000-0"
          icon={<FiCreditCard />}
          esValido={esValido}
          error={error}
          disabled={isLoading}
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

      <div className={styles.buttonWrapper}>
        <Button
          type="button"
          variant="primary"
          onClick={onValidar}
          disabled={!esValido}
          isLoading={isLoading}
          className={styles.actionBtn}
        >
          {isLoading ? "BUSCANDO..." : buttonText}
        </Button>
      </div>
    </div>
  );
});
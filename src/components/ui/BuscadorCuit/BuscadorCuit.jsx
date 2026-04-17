import React, { forwardRef } from "react";
import { FiCreditCard } from "react-icons/fi";
import { InputSocioMasked, Button } from "../../ui";
import styles from "./BuscadorCuit.module.css";

export const BuscadorCuit = forwardRef(({
  label = "CUIT / CUIL",
  onValidar,
  error,
  esValido,
  isLoading = false,
  buttonText = "VALIDAR CUIT",
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
          {...rest}
          value={rest.value || ""}
          onChange={(val) => {
            const limpio = val ? String(val).replace(/\D/g, "").slice(0, 11) : "";
            
            if (rest.onChange) {
              rest.onChange({ target: { value: limpio } });
            }
          }}
        />
      </div>

      <div className={styles.buttonWrapper}>
        <Button
          type="button"
          variant="primary"
          onClick={onValidar}
          disabled={isLoading}
          className={styles.actionBtn}
        >
          {isLoading ? "BUSCANDO..." : buttonText}
        </Button>
      </div>
    </div>
  );
});
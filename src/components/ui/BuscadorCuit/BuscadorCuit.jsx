import React, { forwardRef } from "react";
import { InputFlotante, Button } from "../../ui";
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
        <InputFlotante
          ref={ref}
          label={label}
          type="text"
          maxLength={11}
          esValido={esValido}
          error={error}
          disabled={isLoading}
          {...rest}
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
            if (rest.onChange) rest.onChange(e);
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
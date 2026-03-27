import React from "react";
import styles from "./InputMonto.module.css";

export const InputMonto = React.forwardRef(
  (
    {
      label,
      error,
      currency = "$",
      // eslint-disable-next-line no-unused-vars
      esValido,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}

        <div className={styles.container}>
          <span className={styles.currency}>{currency}</span>

          <input
            type="number"
            className={styles.input}
            placeholder="0"
            ref={ref}
            {...props}
          />
        </div>

        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  },
);
InputMonto.displayName = "InputMonto";

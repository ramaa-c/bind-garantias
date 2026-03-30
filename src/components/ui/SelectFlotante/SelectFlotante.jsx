import React from "react";
import styles from "./SelectFlotante.module.css";
import { FiChevronDown } from "react-icons/fi";

const EMPTY_ARRAY = [];

export const SelectFlotante = React.forwardRef(
  ({ label, error, options = EMPTY_ARRAY, className = "", id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || props.name || generatedId;
    return (
      <div className={`${styles.group} ${className}`}>
        <select id={selectId} className={styles.select} ref={ref} required {...props}>
          <option value="" disabled hidden></option>

          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label htmlFor={selectId} className={styles.label}>{label}</label>
        <FiChevronDown className={styles.arrow} size={20} />

        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  },
);

SelectFlotante.displayName = "SelectFlotante";

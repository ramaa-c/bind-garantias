import React from "react";
import styles from "./SelectFlotante.module.css";
import { FiChevronDown } from "react-icons/fi";

const EMPTY_ARRAY = [];

export const SelectFlotante = React.forwardRef(
  ({ label, error, options = EMPTY_ARRAY, className = "", ...props }, ref) => {
    return (
      <div className={`${styles.group} ${className}`}>
        <select className={styles.select} ref={ref} required {...props}>
          <option value="" disabled hidden></option>

          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className={styles.label}>{label}</label>
        <FiChevronDown className={styles.arrow} size={20} />

        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  },
);

SelectFlotante.displayName = "SelectFlotante";

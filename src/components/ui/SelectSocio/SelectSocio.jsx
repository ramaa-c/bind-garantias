import React from "react";
import { Controller } from "react-hook-form";
import ReactSelect from "react-select";
import styles from "./SelectSocio.module.css";

const customStyles = {
  control: (base) => ({
    ...base,
    minHeight: "100%",
    height: "100%",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    cursor: "pointer",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "1.1rem 1rem 0.4rem 1rem",
  }),
  placeholder: (base) => ({
    ...base,
    color: "transparent",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--white)",
    margin: 0,
  }),
  input: (base) => ({
    ...base,
    color: "var(--white)",
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "var(--yellow)" : "#888",
    padding: "0 1rem 0 0",
    "&:hover": { color: "var(--yellow)" },
  }),
  menu: (base, state) => ({
    ...base,
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: "0.5rem",
    zIndex: 50,
    overflow: "hidden",
    width: state.selectProps.icon ? "calc(100% + 3.2rem)" : "100%",
    marginLeft: state.selectProps.icon ? "-3.2rem" : "0",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--yellow)"
      : state.isFocused
        ? "rgba(244, 245, 0, 0.1)"
        : "transparent",
    color: state.isSelected
      ? "#000"
      : state.isFocused
        ? "var(--yellow)"
        : "var(--white)",
    cursor: "pointer",
    padding: "0.75rem 1rem",
    "&:active": { backgroundColor: "var(--yellow)", color: "#000" },
  }),
};

export const SelectSocio = ({
  control,
  name,
  label,
  icon,
  options = [],
  error,
  esValido,
  className = "",
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref }, fieldState }) => {
        const hasError = !!(error || fieldState.error);
        const errorMessage = error || fieldState.error?.message;

        const selectedOption =
          options.find((c) => String(c.value) === String(value)) || null;

        const hasValue = selectedOption !== null;

        return (
          <div
            className={`${styles.container} ${hasError ? styles.hasError : ""} ${
              !hasError && esValido && hasValue ? styles.isValid : ""
            } ${hasValue ? styles.hasValue : ""} ${className}`}
          >
            <div className={styles.innerGroup}>
              {icon && <div className={styles.icon}>{icon}</div>}

              <div className={styles.fieldGroup}>
                <ReactSelect
                  ref={ref}
                  value={selectedOption}
                  onChange={(val) => onChange(val ? val.value : "")}
                  options={options}
                  styles={customStyles}
                  className={styles.selectWrapper}
                  icon={icon}
                  {...props}
                />
                <label className={styles.label}>{label}</label>
              </div>
            </div>

            {hasError && (
              <span className={styles.errorMsg}>{errorMessage}</span>
            )}
          </div>
        );
      }}
    />
  );
};

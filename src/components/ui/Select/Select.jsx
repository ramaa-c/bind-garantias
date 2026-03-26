import React from "react";
import { Controller } from "react-hook-form";
import ReactSelect from "react-select";
import styles from "./Select.module.css";

const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    height: "3.25rem",
    minHeight: "3.25rem",
    backgroundColor: state.isDisabled
      ? "rgba(255, 255, 255, 0.01)"
      : state.isFocused
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(255, 255, 255, 0.03)",
    borderColor: hasError
      ? "#ff5252"
      : state.isFocused
        ? "var(--yellow)"
        : "rgba(255, 255, 255, 0.1)",
    borderRadius: "0.5rem",
    boxShadow: "none",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? 0.6 : 1,
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: hasError
        ? "#ff5252"
        : state.isFocused
          ? "var(--yellow)"
          : "rgba(255, 255, 255, 0.3)",
      backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
  }),

  placeholder: (base) => ({
    ...base,
    color: "#666",
    fontSize: "0.95rem",
    fontWeight: "400",
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: "0.5rem",
    zIndex: 50,
    padding: "0.5rem 0",
    overflow: "hidden",
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
    fontWeight: state.isSelected ? "bold" : "500",
    padding: "0.75rem 1rem",
    transition: "all 0.1s ease",
    "&:active": {
      backgroundColor: "var(--yellow)",
      color: "#000",
    },
  }),

  singleValue: (base) => ({
    ...base,
    color: "var(--white)",
    fontWeight: "500",
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "var(--yellow)" : "#888",
    transition: "color 0.2s ease",
    "&:hover": {
      color: "var(--yellow)",
    },
  }),

  input: (base) => ({
    ...base,
    color: "var(--white)",
  }),
});

export const Select = ({
  name,
  control,
  label,
  options,
  placeholder = "Seleccione...",
  disabled = false,
  isSearchable = false,
  error,
}) => {
  return (
    <div className={styles.indicatorWrapper}>
      {label && <span className={styles.indicatorLabel}>{label}</span>}

      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <ReactSelect
            {...field}
            options={options}
            styles={selectStyles(!!error)}
            isDisabled={disabled}
            isSearchable={isSearchable}
            placeholder={placeholder}
            value={options.find((c) => c.value === field.value) || null}
            onChange={(val) => field.onChange(val ? val.value : "")}
            aria-label={label || placeholder}
          />
        )}
      />

      <div className={styles.errorContainer}>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    </div>
  );
};

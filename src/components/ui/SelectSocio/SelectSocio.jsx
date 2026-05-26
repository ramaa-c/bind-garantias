import React, { useState } from "react";
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
    padding: "0 1rem",
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
    backgroundColor: "#181818",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
    zIndex: 50,
    overflow: "hidden",
    width: state.selectProps.icon ? "calc(100% + 3.2rem)" : "100%",
    marginLeft: state.selectProps.icon ? "-3.2rem" : "0",
    marginTop: "0.375rem",
  }),
  menuList: (base) => ({
    ...base,
    padding: "0.375rem",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--yellow)"
      : state.isFocused
        ? "rgba(244, 245, 0, 0.08)"
        : "transparent",
    color: state.isSelected
      ? "#000"
      : state.isFocused
        ? "var(--yellow)"
        : "#ccc",
    cursor: "pointer",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    "&:active": { backgroundColor: "var(--yellow)", color: "#000" },
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref, onBlur }, fieldState }) => {
        const hasError = !!(error || fieldState.error);
        const errorMessage = error || fieldState.error?.message;

        const selectedOption =
          options.find((c) => String(c.value) === String(value)) || null;

        const hasValue = selectedOption !== null;

        let statusClass = styles.statusDefault;
        if (hasError) {
          statusClass = styles.statusError;
        } else if (isFocused) {
          statusClass = styles.statusFocus;
        } else if (esValido && hasValue) {
          statusClass = styles.statusSuccess;
        }

        const handleFocus = () => setIsFocused(true);
        const handleBlur = (e) => {
          setIsFocused(false);
          onBlur(e);
        };

        const containerClasses = [
          styles.container,
          statusClass,
          hasValue || isFocused ? styles.hasValue : "",
          className,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div className={containerClasses}>
            <div className={styles.innerGroup}>
              {icon && <div className={styles.icon}>{icon}</div>}

              <div className={styles.fieldGroup}>
                <ReactSelect
                  ref={ref}
                  value={selectedOption}
                  onChange={(val) => onChange(val ? val.value : "")}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  options={options}
                  styles={customStyles}
                  className={styles.selectWrapper}
                  icon={icon}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
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

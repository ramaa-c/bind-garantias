import React from "react";
import { Controller } from "react-hook-form";
import ReactSelect from "react-select";
import styles from "./Select.module.css";

const selectStyles = (hasError, size, variant) => {
  const isAdmin = variant === "admin" || (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));
  const bgDefault = isAdmin ? "var(--bg-surface)" : "rgba(var(--overlay-rgb), 0.03)";
  const bgFocused = isAdmin ? "rgba(76, 101, 230, 0.08)" : "rgba(var(--overlay-rgb), 0.06)";
  const focusColor = isAdmin ? "var(--color-azul-bind)" : "var(--yellow)";
  const bgSelected = isAdmin ? "var(--color-azul-bind)" : "var(--yellow)";
  const bgOptionFocused = isAdmin ? "rgba(76, 101, 230, 0.15)" : "rgba(244, 245, 0, 0.1)";
  const textSelected = isAdmin ? "var(--white)" : "#000";
  const textOptionFocused = isAdmin ? "var(--color-azul-bind-300)" : "var(--yellow)";

  return {
    control: (base, state) => ({
      ...base,
      height: size === "sm" ? "2.5rem" : "3.25rem",
      minHeight: size === "sm" ? "2.5rem" : "3.25rem",
      backgroundColor: state.isDisabled
        ? "rgba(var(--overlay-rgb), 0.01)"
        : hasError
          ? "rgba(255, 82, 82, 0.05)"
          : state.isFocused
            ? bgFocused
            : bgDefault,
      borderColor: hasError
        ? "var(--danger-bright)"
        : state.isFocused
          ? focusColor
          : isAdmin
            ? "var(--border-hover)"
            : "rgba(var(--overlay-rgb), 0.1)",
      borderRadius: "0.5rem",
      boxShadow: "none",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? 0.6 : 1,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: hasError
          ? "var(--danger-bright)"
          : state.isFocused
            ? focusColor
            : isAdmin
              ? "rgba(76, 101, 230, 0.5)"
              : "rgba(var(--overlay-rgb), 0.3)",
        backgroundColor: hasError
          ? "rgba(255, 82, 82, 0.05)"
          : isAdmin
            ? "rgba(76, 101, 230, 0.04)"
            : "rgba(var(--overlay-rgb), 0.06)",
      },
    }),

    placeholder: (base) => ({
      ...base,
      color: "var(--text-dim)",
      fontSize: size === "sm" ? "0.875rem" : "0.95rem",
      fontWeight: "400",
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: isAdmin ? "var(--border)" : "var(--bg-elevado)",
      border: isAdmin ? "1px solid var(--border-hover)" : "1px solid var(--border-hover)",
      borderRadius: "0.5rem",
      zIndex: 50,
      padding: "0.5rem 0",
      overflow: "hidden",
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? bgSelected
        : state.isFocused
          ? bgOptionFocused
          : "transparent",
      color: state.isSelected
        ? textSelected
        : state.isFocused
          ? textOptionFocused
          : "var(--white)",
      cursor: "pointer",
      fontWeight: state.isSelected ? "bold" : "500",
      padding: size === "sm" ? "0.5rem 1rem" : "0.75rem 1rem",
      transition: "all 0.1s ease",
      "&:active": {
        backgroundColor: bgSelected,
        color: textSelected,
      },
    }),

    singleValue: (base) => ({
      ...base,
      color: "var(--white)",
      fontWeight: "500",
      fontSize: size === "sm" ? "0.875rem" : "0.95rem",
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? focusColor : "var(--text-muted)",
      transition: "color 0.2s ease",
      padding: size === "sm" ? "4px 8px" : "8px",
      "&:hover": {
        color: focusColor,
      },
    }),

    input: (base) => ({
      ...base,
      color: "var(--white)",
    }),
  };
};

export const Select = ({
  name,
  control,
  label,
  options,
  placeholder = "Seleccione...",
  disabled = false,
  isSearchable = false,
  error,
  hideErrorSpace = false,
  value,
  onChange,
  size = "md",
  variant = "default",
}) => {
  return (
    <div className={styles.indicatorWrapper}>
      {label && <span className={styles.indicatorLabel}>{label}</span>}

      {control ? (
        <Controller
          name={name}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={options}
              styles={selectStyles(!!error, size, variant)}
              isDisabled={disabled}
              isSearchable={isSearchable}
              placeholder={placeholder}
              value={options.find((c) => c.value === field.value) || null}
              onChange={(val) => field.onChange(val ? val.value : "")}
              aria-label={label || placeholder}
            />
          )}
        />
      ) : (
        <ReactSelect
          options={options}
          styles={selectStyles(!!error, size, variant)}
          isDisabled={disabled}
          isSearchable={isSearchable}
          placeholder={placeholder}
          value={options.find((c) => c.value === value) || null}
          onChange={(val) => onChange && onChange(val ? val.value : "")}
          aria-label={label || placeholder}
        />
      )}

      {!hideErrorSpace && (
        <div className={styles.errorContainer}>
          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      )}
    </div>
  );
};

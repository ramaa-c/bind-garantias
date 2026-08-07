import React, { useState } from "react";
import { Controller } from "react-hook-form";
import ReactSelect from "react-select";
import inputStyles from "../InputSimple/InputSimple.module.css";

export const SelectSimple = ({
  name,
  control,
  label,
  options,
  placeholder = "Seleccione...",
  disabled = false,
  isSearchable = false,
  error,
  hideErrorSpace = false,
  value: manualValue,
  onChange: manualOnChange,
  onBlur: manualOnBlur,
  variant,
  compact = false,
  className = "",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // We determine if we are in admin mode to apply the blue focus theme
  const isAdmin = variant === "admin" || (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));

  const focusColor = isAdmin ? "var(--color-azul-bind, #4c65e6)" : "var(--yellow, #f4f500)";
  const bgSelected = isAdmin ? "var(--color-azul-bind, #4c65e6)" : "var(--yellow, #f4f500)";
  const textSelected = isAdmin ? "#ffffff" : "#000";
  const bgOptionFocused = isAdmin ? "rgba(76, 101, 230, 0.15)" : "rgba(244, 245, 0, 0.1)";
  const textOptionFocused = isAdmin ? "var(--color-azul-bind-300, #8a9fff)" : "var(--yellow, #f4f500)";

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      border: "none",
      boxShadow: "none",
      minHeight: compact ? "2.35rem" : "3.2rem",
      height: compact ? "2.35rem" : "3.2rem", // Fijo, no solo mínimo: sin esto react-select puede quedar más alto que InputSimple/SelectFechaSimple según el contenido interno.
      cursor: state.isDisabled ? "not-allowed" : "pointer",
    }),
    // El paddingTop (espacio para el label flotante) va acá y no en `control`:
    // si estuviera en `control` empujaba hacia abajo TODOS sus hijos por
    // igual, incluida la flecha del indicatorsContainer, descentrándola
    // verticalmente. Así solo se corre el texto del valor.
    valueContainer: (base) => ({
      ...base,
      padding: compact ? "0.5rem 0.75rem 0" : "0.85rem 1rem 0",
      flexWrap: "nowrap",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: compact ? "2.35rem" : "3.2rem",
      alignItems: "center",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--white, #fff)",
      fontWeight: "500",
      fontSize: compact ? "0.825rem" : "1rem",
      letterSpacing: "0.01em",
      fontFamily: "var(--font-principal, inherit)",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#555",
      fontSize: compact ? "0.825rem" : "1rem",
      fontFamily: "var(--font-principal, inherit)",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
    input: (base) => ({
      ...base,
      color: "var(--white, #fff)",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: isFocused ? focusColor : "#8b949e",
      padding: compact ? "6px 8px" : "8px 12px",
      "&:hover": {
        color: focusColor,
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: "0.5rem",
      zIndex: 99999,
      padding: "0.5rem 0",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
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
          : "var(--white, #fff)",
      cursor: "pointer",
      fontWeight: state.isSelected ? "bold" : "500",
      padding: "0.6rem 1rem",
      transition: "all 0.1s ease",
      "&:active": {
        backgroundColor: bgSelected,
        color: textSelected,
      },
    }),
  };

  const renderSelect = (val, onCh, onBl, ref) => {
    const matchedOption = options ? options.find((c) => String(c.value) === String(val)) : null;
    const hasValue = val !== undefined && val !== null && (String(val).length > 0 || !!matchedOption);
    const hasError = !!error;

    let statusClass = inputStyles.statusDefault;
    if (hasError) {
      statusClass = inputStyles.statusError;
    } else if (isFocused) {
      statusClass = inputStyles.statusFocus;
    }

    const containerClasses = [
      inputStyles.group,
      statusClass,
      hasValue || isFocused ? inputStyles.hasValue : "",
      isAdmin ? inputStyles.adminVariant : "",
      hideErrorSpace ? inputStyles.noErrorSpace : "",
      compact ? inputStyles.compact : "",
      className,
    ].filter(Boolean).join(" ");

    return (
      <div className={containerClasses}>
        <div className={inputStyles.inputWrapper}>
          <ReactSelect
            ref={ref}
            options={options}
            styles={customSelectStyles}
            isDisabled={disabled}
            isSearchable={isSearchable}
            placeholder={isFocused ? placeholder : ""}
            value={options.find((c) => String(c.value) === String(val)) || null}
            onChange={(selectedOption) => {
              if (onCh) onCh(selectedOption ? selectedOption.value : "");
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (onBl) onBl();
            }}
            aria-label={label}
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            menuPosition="fixed"
          />
          <label className={inputStyles.label}>
            {label}
          </label>
        </div>
        {hasError && !hideErrorSpace && <span className={inputStyles.errorMsg}>{error}</span>}
      </div>
    );
  };

  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field: { onChange, onBlur, value, ref } }) => renderSelect(value, onChange, onBlur, ref)}
      />
    );
  }

  return renderSelect(manualValue, manualOnChange, manualOnBlur, null);
};

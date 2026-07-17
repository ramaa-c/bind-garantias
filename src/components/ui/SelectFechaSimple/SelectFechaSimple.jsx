import React, { useState, useRef, useEffect } from "react";
import { useFormContext, useFormState, Controller } from "react-hook-form";
import { FiCalendar } from "react-icons/fi";
import { DayPicker } from "react-day-picker";
import { format, parseISO, isValid as isValidDate } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import inputStyles from "../InputSimple/InputSimple.module.css";
import customStyles from "./SelectFechaSimple.module.css";

export const SelectFechaSimple = ({
  name,
  label = "Fecha",
  disabled = false,
  minDate,
  error: errorExterno,
  value: manualValue,
  onChange: manualOnChange,
  variant,
  placement = "bottom",
  hideErrorSpace = false,
  className = "",
}) => {
  const formContext = useFormContext();
  const control = formContext?.control;
  const effectiveMinDate = minDate || new Date();
  
  const { errors } = control ? useFormState({ control, name }) : { errors: {} };

  const errorContexto = control && name
    ? name.split(".").reduce((obj, key) => obj?.[key], errors)
    : null;
  const errorDisplay = errorExterno || errorContexto?.message;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderCalendar = (value, onChange, onBlur, ref) => {
    let dateObj = undefined;

    if (value) {
      if (value.includes && value.includes("T")) {
        const parsed = parseISO(value);
        if (isValidDate(parsed)) dateObj = parsed;
      } else if (typeof value === "string") {
        const parsed = new Date(value + "T00:00:00");
        if (isValidDate(parsed)) dateObj = parsed;
      } else if (value instanceof Date && isValidDate(value)) {
        dateObj = value;
      }
    }

    const hasValue = !!dateObj;
    const hasError = !!errorDisplay;
    const isAdmin = variant === "admin" || (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));

    let statusClass = inputStyles.statusDefault;
    if (hasError) {
      statusClass = inputStyles.statusError;
    } else if (isCalendarOpen || isFocused) {
      statusClass = inputStyles.statusFocus;
    }

    const containerClasses = [
      inputStyles.group,
      statusClass,
      hasValue || isCalendarOpen || isFocused ? inputStyles.hasValue : "",
      isAdmin ? inputStyles.adminVariant : "",
      hideErrorSpace ? inputStyles.noErrorSpace : "",
      className,
    ].filter(Boolean).join(" ");

    const handleDateSelect = (date) => {
      if (!date) {
        onChange("");
        return;
      }
      const adjusted = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      const isoString = adjusted.toISOString();
      onChange(isoString);
      setIsCalendarOpen(false);
      setIsFocused(false);
    };

    return (
      <div className={containerClasses} ref={calendarRef}>
        <div className={inputStyles.inputWrapper} onClick={() => !disabled && setIsCalendarOpen(!isCalendarOpen)}>
          <input
            type="text"
            readOnly
            className={inputStyles.input}
            value={hasValue ? format(dateObj, "dd/MM/yyyy", { locale: es }) : ""}
            placeholder=" "
            disabled={disabled}
            onFocus={() => {
              if (!disabled) setIsFocused(true);
            }}
            onBlur={() => {
              if (onBlur) onBlur();
            }}
            ref={ref}
            style={{ cursor: "pointer" }}
          />
          <label className={inputStyles.label}>
            {label}
          </label>
          
          <div className={inputStyles.actions}>
            <button
              type="button"
              className={inputStyles.toggleBtn}
              tabIndex="-1"
              style={{ color: (isCalendarOpen || isFocused || hasValue) ? 'var(--color-azul-bind, #4c65e6)' : '#8b949e' }}
            >
              <FiCalendar size={17} />
            </button>
          </div>
        </div>

        {hasError && <span className={inputStyles.errorMsg}>{errorDisplay}</span>}

        {isCalendarOpen && (
          <div
            className={`${customStyles.calendarPopover} ${placement === "top" ? customStyles.placementTop : ""}`}
          >
            <DayPicker
              mode="single"
              selected={dateObj}
              onSelect={handleDateSelect}
              locale={es}
              disabled={{ before: effectiveMinDate }}
              required
              captionLayout="dropdown-years"
              fromYear={effectiveMinDate.getFullYear()}
              toYear={effectiveMinDate.getFullYear() + 10}
            />
          </div>
        )}
      </div>
    );
  };

  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field: { onChange, value, onBlur, ref } }) => renderCalendar(value, onChange, onBlur, ref)}
      />
    );
  }

  return renderCalendar(manualValue, manualOnChange, () => {}, null);
};

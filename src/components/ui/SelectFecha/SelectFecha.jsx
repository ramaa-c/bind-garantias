import React, { useState, useRef, useEffect } from "react";
import { useFormContext, useFormState, Controller } from "react-hook-form";
import { FiCalendar } from "react-icons/fi";
import { DayPicker } from "react-day-picker";
import { format, parseISO, isValid as isValidDate } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import styles from "./SelectFecha.module.css";

export const SelectFecha = ({
  name,
  label = "Fecha",
  disabled = false,
  minDate,
  error: errorExterno,
}) => {
  const { control } = useFormContext();
  const effectiveMinDate = minDate || new Date();
  const { errors } = useFormState({ control, name });

  const errorContexto = name
    .split(".")
    .reduce((obj, key) => obj?.[key], errors);
  const errorDisplay = errorExterno || errorContexto?.message;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field: { onChange, value, onBlur } }) => {
        let dateObj = undefined;

        if (value) {
          if (value.includes("T")) {
            const parsed = parseISO(value);
            if (isValidDate(parsed)) dateObj = parsed;
          } else {
            const parsed = new Date(value + "T00:00:00");
            if (isValidDate(parsed)) dateObj = parsed;
          }
        }

        const hasValue = !!dateObj;
        const hasError = !!errorDisplay;
        const isValid = !hasError && hasValue;

        const handleDateSelect = (date) => {
          if (!date) return;
          const dateString = format(date, "yyyy-MM-dd'T'00:00:00");
          onChange(dateString);
          setIsCalendarOpen(false);
        };

        return (
          <div
            ref={calendarRef}
            className={`
              ${styles.container} 
              ${hasError ? styles.hasError : ""} 
              ${isValid ? styles.isValid : ""} 
              ${hasValue || isCalendarOpen ? styles.hasValue : ""}
              ${disabled ? styles.isDisabled : ""}
            `}
          >
            <div className={styles.innerGroup}>
              <div className={styles.icon}>
                <FiCalendar />
              </div>

              <div className={styles.fieldGroup}>
                <button
                  type="button"
                  disabled={disabled}
                  onBlur={onBlur}
                  className={styles.triggerBtn}
                  onClick={() =>
                    !disabled && setIsCalendarOpen(!isCalendarOpen)
                  }
                >
                  {dateObj && (
                    <span className={styles.dateText}>
                      {format(dateObj, "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  )}
                </button>
                <label className={styles.label}>{label}</label>
              </div>
            </div>

            {hasError && (
              <span className={styles.errorMsg}>{errorDisplay}</span>
            )}

            {isCalendarOpen && (
              <div className={styles.calendarPopover}>
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
      }}
    />
  );
};

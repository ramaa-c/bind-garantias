import React, { useState, useRef, useEffect } from "react";
import { useFormContext, useFormState, Controller } from "react-hook-form";
import { FiCalendar } from "react-icons/fi";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
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

  const { errors } = useFormState({ control });

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
    <div className={styles.indicatorWrapper} ref={calendarRef}>
      {label && <span className={styles.indicatorLabel}>{label}</span>}

      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field: { onChange, value, onBlur } }) => {
          const dateObj = value ? new Date(value + "T00:00:00") : undefined;

          const handleDateSelect = (date) => {
            if (!date) return;
            const dateString = format(date, "yyyy-MM-dd");
            onChange(dateString);
            setIsCalendarOpen(false);
          };

          return (
            <>
              <button
                type="button"
                disabled={disabled}
                onBlur={onBlur}
                className={`
                  ${styles.badgeInteractive}
                  ${errorDisplay ? styles.badgeError : ""}
                  ${value && !errorDisplay ? styles.badgeSuccess : ""}
                `}
                onClick={() => !disabled && setIsCalendarOpen(!isCalendarOpen)}
              >
                <FiCalendar className={styles.calendarIcon} />
                {dateObj ? (
                  <span className={styles.dateText}>
                    {format(dateObj, "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                ) : (
                  <span className={styles.placeholderText}>
                    Seleccionar fecha
                  </span>
                )}
              </button>

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
            </>
          );
        }}
      />

      <div className={styles.errorContainer}>
        {errorDisplay && (
          <span className={styles.errorText}>{errorDisplay}</span>
        )}
      </div>
    </div>
  );
};

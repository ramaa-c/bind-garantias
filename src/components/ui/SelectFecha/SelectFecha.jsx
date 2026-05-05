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

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field: { onChange, value, onBlur, ref } }) => {
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

        let statusClass = styles.statusDefault;
        if (hasError) {
          statusClass = styles.statusError;
        } else if (isCalendarOpen || isFocused) {
          statusClass = styles.statusFocus;
        } else if (isValid) {
          statusClass = styles.statusSuccess;
        }

        const handleDateSelect = (date) => {
          if (!date) return;
          const dateString = format(date, "yyyy-MM-dd'T'00:00:00");
          onChange(dateString);
          setIsCalendarOpen(false);
          setIsFocused(false);
        };

        const handleTriggerClick = () => {
          if (!disabled) {
            setIsCalendarOpen(!isCalendarOpen);
            setIsFocused(!isCalendarOpen);
          }
        };

        const handleBlur = (e) => {
          if (!isCalendarOpen) {
            setIsFocused(false);
            onBlur(e);
          }
        };

        const containerClasses = [
          styles.container,
          statusClass,
          hasValue || isCalendarOpen || isFocused ? styles.hasValue : "",
          disabled ? styles.isDisabled : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div ref={calendarRef} className={containerClasses}>
            <div className={styles.innerGroup}>
              <div className={styles.icon}>
                <FiCalendar />
              </div>

              <div className={styles.fieldGroup}>
                <button
                  type="button"
                  disabled={disabled}
                  onFocus={() => setIsFocused(true)}
                  onBlur={handleBlur}
                  className={styles.triggerBtn}
                  onClick={handleTriggerClick}
                  ref={ref}
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

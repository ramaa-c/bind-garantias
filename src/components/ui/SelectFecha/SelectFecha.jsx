import React, { useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
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
  minDate = new Date(),
}) => {
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  const fechaValue = watch(name);
  const dateObj = fechaValue ? new Date(fechaValue + "T00:00:00") : undefined;

  const error = name.split(".").reduce((obj, key) => obj?.[key], errors);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = async (date) => {
    if (!date) return;
    const dateString = format(date, "yyyy-MM-dd");

    setValue(name, dateString, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsCalendarOpen(false);
    await trigger(name);
  };

  return (
    <div className={styles.indicatorWrapper} ref={calendarRef}>
      <span className={styles.indicatorLabel}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        className={`${styles.badgeInteractive} ${error ? styles.badgeError : ""} ${fechaValue ? styles.badgeSuccess : ""}`}
        onClick={() => !disabled && setIsCalendarOpen(!isCalendarOpen)}
      >
        <FiCalendar className={styles.calendarIcon} />
        {dateObj ? (
          <span className={styles.dateText}>
            {format(dateObj, "dd 'de' MMMM, yyyy", { locale: es })}
          </span>
        ) : (
          <span className={styles.placeholderText}>Seleccionar fecha</span>
        )}
      </button>

      {isCalendarOpen && (
        <div className={styles.calendarPopover}>
          <DayPicker
            mode="single"
            selected={dateObj}
            onSelect={handleDateSelect}
            locale={es}
            disabled={{ before: minDate }}
            required
            captionLayout="dropdown-years"
            fromYear={new Date().getFullYear()}
            toYear={new Date().getFullYear() + 10}
          />
        </div>
      )}

      <input type="hidden" value={fechaValue || ""} {...register(name)} />

      <div className={styles.errorContainer}>
        {error && <span className={styles.errorText}>{error.message}</span>}
      </div>
    </div>
  );
};

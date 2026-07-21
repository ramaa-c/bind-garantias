import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  placeholder,
  disabled = false,
  minDate,
  error: errorExterno,
  value: manualValue,
  onChange: manualOnChange,
  variant,
  placement = "bottom",
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
  // El popover se saca por Portal a document.body: si el campo está anidado
  // en un panel con overflow:auto/hidden (ej. el visor de DocumentosLegajo),
  // un calendario `position: absolute` normal queda cortado por ese
  // ancestro sin importar si abre para arriba o para abajo. Con Portal +
  // `position: fixed` (ver popoverStyle) el calendario deja de depender del
  // overflow de ningún contenedor padre.
  const popoverRef = useRef(null);
  const [popoverStyle, setPopoverStyle] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dentroDelCampo = calendarRef.current?.contains(event.target);
      const dentroDelPopover = popoverRef.current?.contains(event.target);
      if (!dentroDelCampo && !dentroDelPopover) {
        setIsCalendarOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const actualizarPosicion = () => {
      const rect = calendarRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (placement === "top") {
        setPopoverStyle({
          position: "fixed",
          left: rect.left,
          bottom: window.innerHeight - rect.top + 6,
        });
      } else {
        setPopoverStyle({
          position: "fixed",
          left: rect.left,
          top: rect.bottom + 6,
        });
      }
    };

    actualizarPosicion();
    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);
    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [isCalendarOpen, placement]);

  const renderCalendar = (value, onChange, onBlur, ref) => {
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
          variant === "compact" ? styles.isCompact : "",
        ]
          .filter(Boolean)
          .join(" ");

        const isCompact = variant === "compact";

        return (
          <div ref={calendarRef} className={containerClasses}>
            {isCompact && <label className={styles.labelCompact}>{label}</label>}
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
                  {dateObj ? (
                    <span className={styles.dateText}>
                      {format(dateObj, "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  ) : (
                    placeholder && (
                      <span className={styles.placeholderText}>
                        {placeholder}
                      </span>
                    )
                  )}
                </button>
                {label && <label className={styles.label}>{label}</label>}
              </div>
            </div>

            {hasError && (
              <span className={styles.errorMsg}>{errorDisplay}</span>
            )}

            {isCalendarOpen && popoverStyle &&
              createPortal(
                <div
                  ref={popoverRef}
                  className={`${styles.calendarPopover} ${styles.calendarPopoverPortal} ${placement === "top" ? styles.placementTop : ""}`}
                  style={popoverStyle}
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
                </div>,
                document.body,
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

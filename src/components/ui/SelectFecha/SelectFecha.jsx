import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
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
  // `position: fixed` el calendario deja de depender del overflow de ningún
  // contenedor padre.
  const popoverRef = useRef(null);

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

  // La posición se calcula midiendo el popover ya montado (alto real de
  // react-day-picker, que varía según el mes/los dropdowns de año) y se
  // aplica mutando el estilo directamente en vez de por React state: así no
  // hace falta un segundo render para reposicionar y no hay flash en la
  // posición equivocada. `placement` es una preferencia, no una garantía —
  // si el lado pedido no entra entero se abre para el que tenga más
  // espacio, y el resultado siempre se clampea contra los bordes del
  // viewport para que el calendario nunca quede ni cortado ni fuera de
  // pantalla, sea cual sea el tamaño de ventana o zoom.
  useLayoutEffect(() => {
    if (!isCalendarOpen) return undefined;

    const MARGEN = 8;
    const GAP = 6;

    const posicionarPopover = () => {
      const trigger = calendarRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const rect = trigger.getBoundingClientRect();
      const altoPopover = popover.offsetHeight;
      const anchoPopover = popover.offsetWidth;

      const espacioArriba = rect.top;
      const espacioAbajo = window.innerHeight - rect.bottom;
      const prefiereArriba = placement === "top";
      const abreArriba = prefiereArriba
        ? espacioArriba >= altoPopover + MARGEN || espacioArriba >= espacioAbajo
        : espacioAbajo < altoPopover + MARGEN && espacioArriba > espacioAbajo;

      const topIdeal = abreArriba ? rect.top - GAP - altoPopover : rect.bottom + GAP;
      const top = Math.max(MARGEN, Math.min(topIdeal, window.innerHeight - altoPopover - MARGEN));
      const left = Math.max(MARGEN, Math.min(rect.left, window.innerWidth - anchoPopover - MARGEN));

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      popover.style.visibility = "visible";
    };

    posicionarPopover();
    window.addEventListener("scroll", posicionarPopover, true);
    window.addEventListener("resize", posicionarPopover);
    return () => {
      window.removeEventListener("scroll", posicionarPopover, true);
      window.removeEventListener("resize", posicionarPopover);
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

            {isCalendarOpen &&
              createPortal(
                <div
                  ref={popoverRef}
                  className={`${styles.calendarPopover} ${styles.calendarPopoverPortal} ${placement === "top" ? styles.placementTop : ""}`}
                  style={{ position: "fixed" }}
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

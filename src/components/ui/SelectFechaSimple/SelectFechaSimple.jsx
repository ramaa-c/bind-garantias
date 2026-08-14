import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useFormContext, useFormState, Controller } from "react-hook-form";
import { FiCalendar } from "react-icons/fi";
import { DayPicker } from "react-day-picker";
import { format, parseISO, isValid as isValidDate, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import inputStyles from "../InputSimple/InputSimple.module.css";
import customStyles from "./SelectFechaSimple.module.css";

export const SelectFechaSimple = ({
  name,
  label = "Fecha",
  disabled = false,
  minDate,
  maxDate,
  disableFuture = false,
  error: errorExterno,
  value: manualValue,
  onChange: manualOnChange,
  variant,
  placement = "bottom",
  hideErrorSpace = false,
  className = "",
  mostrarDiasDesdeHoy = false,
  compact = false,
}) => {
  const formContext = useFormContext();
  const control = formContext?.control;

  // Por defecto el picker solo permite fechas futuras (before: hoy
  // deshabilitado) - pensado para casos como "fecha de vencimiento". Con
  // disableFuture=true se invierte para casos históricos (ej: filtrar
  // solicitudes ya cargadas): se deshabilita todo lo posterior a hoy (o a
  // maxDate). minDate/maxDate además permiten acotar el rango en cualquiera
  // de los dos modos (ej: para enlazar un "Desde"/"Hasta" entre sí).
  const today = new Date();
  let disabledMatchers;
  let fromYear;
  let toYear;
  if (disableFuture) {
    const upper = maxDate || today;
    disabledMatchers = minDate ? [{ after: upper }, { before: minDate }] : [{ after: upper }];
    fromYear = (minDate || upper).getFullYear() - 5;
    toYear = upper.getFullYear();
  } else {
    const lower = minDate || today;
    disabledMatchers = maxDate ? [{ before: lower }, { after: maxDate }] : [{ before: lower }];
    fromYear = lower.getFullYear();
    toYear = (maxDate || lower).getFullYear() + 10;
  }

  const { errors } = control ? useFormState({ control, name }) : { errors: {} };

  const errorContexto = control && name
    ? name.split(".").reduce((obj, key) => obj?.[key], errors)
    : null;
  const errorDisplay = errorExterno || errorContexto?.message;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const calendarRef = useRef(null);
  // El popover se saca por Portal a document.body: si el campo está anidado
  // en un panel con overflow:auto/hidden, un popover `position: absolute`
  // normal queda cortado (o directamente invisible) por ese ancestro. Con
  // Portal + `position: fixed` deja de depender del overflow de ningún
  // contenedor padre (ver SelectFecha, mismo patrón).
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

  // Mismo algoritmo de posicionamiento que SelectFecha: mide el popover ya
  // montado (alto real, no una estimación) y muta su estilo directamente
  // (sin pasar por React state) para no necesitar un segundo render ni
  // arriesgar un flash en la posición equivocada. `placement` es una
  // preferencia; si ese lado no entra entero se abre para el que tenga más
  // espacio, y el resultado siempre se clampea contra los bordes del
  // viewport.
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
      const left = Math.max(MARGEN, Math.min(rect.right - anchoPopover, window.innerWidth - anchoPopover - MARGEN));

      popover.style.top = `${top}px`;
      popover.style.left = `${Math.max(MARGEN, left)}px`;
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
    const diasDesdeHoy = hasValue
      ? Math.max(0, differenceInCalendarDays(dateObj, new Date()))
      : null;
    const hasError = !!errorDisplay;
    const isAdmin = variant === "admin" || (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));
    const focusColor = isAdmin ? "var(--color-azul-bind, #4c65e6)" : "var(--yellow, #f4f500)";

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
      compact ? inputStyles.compact : "",
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
            value={
              hasValue
                ? `${format(dateObj, "dd/MM/yyyy", { locale: es })}${
                    mostrarDiasDesdeHoy ? ` · ${diasDesdeHoy} días` : ""
                  }`
                : ""
            }
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
              style={{ color: (isCalendarOpen || isFocused || hasValue) ? focusColor : '#8b949e' }}
            >
              <FiCalendar size={compact ? 14 : 17} />
            </button>
          </div>
        </div>

        {hasError && <span className={inputStyles.errorMsg}>{errorDisplay}</span>}

        {isCalendarOpen &&
          createPortal(
            <div
              ref={popoverRef}
              className={`${customStyles.calendarPopover} ${customStyles.calendarPopoverPortal} ${placement === "top" ? customStyles.placementTop : ""}`}
              style={{ position: "fixed" }}
            >
              <DayPicker
                mode="single"
                selected={dateObj}
                onSelect={handleDateSelect}
                locale={es}
                disabled={disabledMatchers}
                required
                captionLayout="dropdown-years"
                fromYear={fromYear}
                toYear={toYear}
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

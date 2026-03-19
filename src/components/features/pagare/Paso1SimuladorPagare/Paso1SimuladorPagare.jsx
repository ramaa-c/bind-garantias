import React, { useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FiCalendar } from "react-icons/fi";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button, Alert, InputMonto } from "../../../ui";
import "react-day-picker/dist/style.css";
import styles from "./Paso1SimuladorPagare.module.css";

export default function Paso1SimuladorPagare({
  simulacionLista,
  setSimulacionLista,
  handleCalcularSimulacion,
  setPasoActual,
}) {
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  const montoValue = watch("monto");
  const fechaValue = watch("fechaPago");

  const dateObj = fechaValue ? new Date(fechaValue + "T00:00:00") : undefined;

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

    setValue("fechaPago", dateString, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsCalendarOpen(false);
    await trigger("fechaPago");
  };
  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        {/* MONEDA  */}
        <div className={styles.indicatorWrapper}>
          <span className={styles.indicatorLabel}>Moneda de operación</span>
          <div className={styles.badgeSolid}>
            <span className={styles.dot}></span>
            DÓLAR ESTADOUNIDENSE (USD)
          </div>
        </div>

        {/* FECHA */}
        <div className={styles.indicatorWrapper} ref={calendarRef}>
          <span className={styles.indicatorLabel}>Fecha de pago</span>
          <button
            type="button"
            disabled={simulacionLista}
            className={`${styles.badgeInteractive} ${errors.fechaPago ? styles.badgeError : ""} ${fechaValue ? styles.badgeSuccess : ""}`}
            onClick={() =>
              !simulacionLista && setIsCalendarOpen(!isCalendarOpen)
            }
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
                disabled={{ before: new Date() }}
                required
              />
            </div>
          )}

          <input
            type="hidden"
            value={fechaValue || ""}
            {...register("fechaPago")}
          />

          <div className={styles.errorContainer}>
            {errors.fechaPago && (
              <span className={styles.errorText}>
                {errors.fechaPago.message}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mainForm}>
        {/* MONTO */}
        <div className={styles.montoSection}>
          <InputMonto
            label="Monto del Pagaré"
            error={errors.monto?.message}
            disabled={simulacionLista}
            esValido={montoValue > 0}
            {...register("monto")}
          />
        </div>
      </div>

      {!simulacionLista ? (
        <div className={styles.calcBtnWrapper}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCalcularSimulacion}
            disabled={!montoValue || !fechaValue}
          >
            SIMULAR COSTOS
          </Button>
        </div>
      ) : (
        /* --- TICKET RESULTADOS --- */
        <div className={styles.breakdownContainer}>
          <div className={styles.breakdownHeader}>
            <span>Neto estimado a recibir:</span>
            <span className={styles.textXl}>
              USD {(montoValue * 0.96).toLocaleString("es-AR")}
            </span>
          </div>

          <div className={styles.breakdownBody}>
            <div className={styles.breakdownRow}>
              <span>Comisión SGR</span>
              <span>USD 811</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>Descuento operado</span>
              <span>USD 446</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>Derecho mercado</span>
              <span>USD 24</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>IVA</span>
              <span>USD 5</span>
            </div>
            <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
              <span className={styles.textYellow}>Total de costos</span>
              <span className={styles.textYellow}>USD 1.286</span>
            </div>
          </div>

          <div className={styles.mtMedium}>
            <Alert variant="warning" layout="box">
              <strong>IMPORTANTE:</strong> Tasa de interés utilizada para el
              cálculo: % TNA (cierre al día hábil cambiario anterior).
            </Alert>
          </div>

          <div className={styles.actionsFlex}>
            <Button
              variant="outline"
              onClick={() => setSimulacionLista(false)}
              className={styles.borderless}
            >
              RECALCULAR
            </Button>
            <Button variant="primary" onClick={() => setPasoActual(2)}>
              CONTINUAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

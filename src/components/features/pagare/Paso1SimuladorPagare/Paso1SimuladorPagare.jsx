import React from "react";
import { useFormContext } from "react-hook-form";
import { Button, Alert, InputMonto } from "../../../ui";
import { SelectFecha } from "../../../ui";
import { FiChevronRight } from "react-icons/fi";
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
    formState: { errors },
  } = useFormContext();

  const montoValue = watch("monto");
  const fechaValue = watch("fechaPago");

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
        <SelectFecha
          name="fechaPago"
          label="Fecha de pago"
          disabled={simulacionLista}
        />
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
            <Button
              variant="primary"
              iconRight={<FiChevronRight />}
              onClick={() => setPasoActual(2)}
            >
              CONTINUAR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

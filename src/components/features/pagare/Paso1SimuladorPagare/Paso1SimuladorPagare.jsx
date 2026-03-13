import React from "react";
import { useFormContext } from "react-hook-form";
import { Input, Button, Alert, InputMonto } from "../../../ui";
import styles from "./Paso1SimuladorPagare.module.css";

export default function Paso1SimuladorPagare({
  simulacionLista,
  setSimulacionLista,
  montoWatch,
  handleCalcularSimulacion,
  setPasoActual,
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={styles.container}>
      {/* MONTO PRINCIPAL */}
      <div className={styles.montoWrapper}>
        <InputMonto
          label="Monto del Pagaré"
          error={errors.monto?.message}
          disabled={simulacionLista}
          {...register("monto")}
        />
      </div>

      {/* FECHA Y MONEDA */}
      <div className={styles.formRowCentered}>
        <div className={`${styles.formCol} ${styles.inputCentrado}`}>
          <Input
            label="Moneda"
            value="Dólar"
            disabled
            readOnly
            className={styles.maxWidth200}
          />
        </div>

        <div className={styles.formCol}>
          <Input
            type="date"
            label="Fecha de pago *"
            error={errors.fechaPago?.message}
            disabled={simulacionLista}
            {...register("fechaPago")}
          />
        </div>
      </div>

      {/* ACCIONES O RESULTADOS */}
      {!simulacionLista ? (
        <div className={styles.calcBtnWrapper}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCalcularSimulacion}
          >
            SIMULAR COSTOS
          </Button>
        </div>
      ) : (
        <div className={styles.breakdownContainer}>
          <div className={styles.breakdownHeader}>
            <span>Neto estimado a recibir:</span>
            <span className={`${styles.textYellow} ${styles.textXl}`}>
              USD {montoWatch * 0.96}
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
            <Button variant="outline" onClick={() => setSimulacionLista(false)}>
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

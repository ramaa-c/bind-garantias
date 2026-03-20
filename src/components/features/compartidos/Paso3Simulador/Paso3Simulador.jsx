import React from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { Button, Alert, InputMonto, SelectFecha, Select } from "../../../ui";
import styles from "./Paso3Simulador.module.css";

const opcionesMoneda = [
  { value: "Pesos", label: "Pesos" },
  { value: "Dolares", label: "Dólares" }
];
const opcionesProducto = [
  { value: "cheques_propios", label: "Cheques propios" },
  { value: "cheques_terceros", label: "Cheques de terceros" }
];
const opcionesCalculo = [
  { value: "tasa_directa", label: "Tasa Directa / Monto a financiar" },
  { value: "por_monto_cheque", label: "Por monto de cheque" }
];

export default function Paso3Simulador({
  mostrarResultados,
  onCalcular,
  onContinuar,
  onCancelar,
}) {
  const { register, watch, control } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const tipoCalculo = watch("tipoCalculo", "tasa_directa");
  const esPorMontoCheque = tipoCalculo === "por_monto_cheque";
  const campoFecha = esPorMontoCheque ? "fechaPago" : "plazo";

  const isMontoValid = !errors.monto && dirtyFields.monto;

  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        
        <Select
          name="moneda"
          control={control}
          label="Moneda"
          options={opcionesMoneda}
          disabled={mostrarResultados}
          error={errors.moneda?.message}
        />

        <Select
          name="tipoProducto"
          control={control}
          label="Tipo de producto"
          options={opcionesProducto}
          disabled={mostrarResultados}
          error={errors.tipoProducto?.message}
        />

        <Select
          name="tipoCalculo"
          control={control}
          label="Tipo de cálculo"
          options={opcionesCalculo}
          disabled={mostrarResultados}
          error={errors.tipoCalculo?.message}
        />

        <SelectFecha
          name={campoFecha}
          label={esPorMontoCheque ? "Fecha de pago" : "Plazo (Fecha)"}
          disabled={mostrarResultados}
        />
      </div>

      {/* --- MONTO --- */}
      <div className={styles.mainForm}>
        <div className={styles.montoSection}>
          <InputMonto
            label={
              esPorMontoCheque ? "Monto de cheque *" : "Monto a financiar *"
            }
            esValido={isMontoValid}
            error={errors.monto?.message}
            disabled={mostrarResultados}
            {...register("monto")}
          />
        </div>
      </div>

      {/* --- ACCIONES Y RESULTADOS --- */}
      {!mostrarResultados ? (
        <div className={styles.calcBtnWrapper}>
          <Button variant="primary" size="lg" onClick={onCalcular}>
            CALCULAR
          </Button>
        </div>
      ) : (
        <div className={styles.resultsBox}>
          <div className={styles.resultsHeader}>
            <h3 className={styles.resultsTitle}>Neto estimado a recibir:</h3>
            <p className={styles.resultsAmount}>$ 2.712.752</p>
          </div>

          <div className={styles.resultsBody}>
            <div className={styles.resultRow}>
              <span>Comisión Garantías (2.5%)</span>
              <span>$ 15.822</span>
            </div>
            <div className={styles.resultRow}>
              <span>Intereses (43.34% TNA*)</span>
              <span>$ 254.299</span>
            </div>
            <div className={styles.resultRow}>
              <span>Derecho bolsa</span>
              <span>$ 0</span>
            </div>
            <div className={styles.resultRow}>
              <span>Derecho mercado (0.06%)</span>
              <span>$ 1.428</span>
            </div>
            <div className={styles.resultRow}>
              <span>Arancel Soc Bolsa</span>
              <span>$ 6.658</span>
            </div>
            <div className={styles.resultRow}>
              <span>Valores al cobro</span>
              <span>$ 6.000</span>
            </div>
            <div className={styles.resultRow}>
              <span>Gestión de cobro</span>
              <span>$ 70</span>
            </div>
            <div className={styles.resultRow}>
              <span>IVA</span>
              <span>$ 2.973</span>
            </div>

            <div className={`${styles.resultRow} ${styles.resultTotalRow}`}>
              <span className={styles.textYellow}>Total de costos</span>
              <span className={styles.textYellow}>$ 287.248</span>
            </div>

            <div className={`${styles.resultRow} ${styles.mtSmall}`}>
              <span className={styles.textMuted}>CFT estimado</span>
              <span className={styles.textMuted}>49.55% anual</span>
            </div>
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>
                {esPorMontoCheque ? "Vto del cheque" : "Plazo estimado"}
              </span>
              <strong>31/07/2026</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>
                {esPorMontoCheque ? "Monto del cheque" : "Monto a financiar"}
              </span>
              <strong>$ 3.000.000</strong>
            </div>
          </div>

          <Alert variant="default" layout="box">
            Tasa promocional subvencionada. IMPORTANTE: La tasa de interés
            utilizada en el simulador es estimativa.
          </Alert>

          <div className={styles.actionsFlex}>
            <Button
              variant="primary"
              onClick={onContinuar}
              className={styles.fullWidthMaxMd}
            >
              CONTINUAR
            </Button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancelar}
            >
              Desisto de avanzar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
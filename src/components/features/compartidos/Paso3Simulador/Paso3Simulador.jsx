import React from "react";
import { useFormContext } from "react-hook-form";
import { Input, Select, Button, Alert, InputMonto } from "../../../ui";
import styles from "./Paso3Simulador.module.css";

export default function Paso3Simulador({
  mostrarResultados,
  onCalcular,
  onContinuar,
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const tipoCalculo = watch("tipoCalculo", "tasa_directa");
  const esPorMontoCheque = tipoCalculo === "por_monto_cheque";

  return (
    <div className={styles.container}>
      {/* GRILLA SUPERIOR */}
      <div className={styles.topGrid}>
        <Select
          label="Moneda *"
          disabled={mostrarResultados}
          options={[
            { value: "Pesos", label: "Pesos" },
            { value: "Dolares", label: "Dólares" },
          ]}
          {...register("moneda")}
        />
        <Select
          label="Tipo de producto *"
          disabled={mostrarResultados}
          options={[
            { value: "cheques_propios", label: "Cheques propios" },
            { value: "cheques_terceros", label: "Cheques de terceros" },
          ]}
          {...register("tipoProducto")}
        />
        <Select
          label="Tipo de cálculo *"
          disabled={mostrarResultados}
          options={[
            {
              value: "tasa_directa",
              label: "Tasa Directa / Monto a financiar",
            },
            { value: "por_monto_cheque", label: "Por monto de cheque" },
          ]}
          {...register("tipoCalculo")}
        />
      </div>

      {/* INPUTS DINÁMICOS */}
      <div className={styles.dynamicRow}>
        <div className={styles.moneyCol}>
          <InputMonto
            label={
              esPorMontoCheque ? "Monto de cheque *" : "Monto a financiar *"
            }
            error={errors.monto?.message}
            disabled={mostrarResultados}
            {...register("monto")}
          />
        </div>

        <div className={styles.dateCol}>
          <Input
            type="date"
            label={esPorMontoCheque ? "Fecha de pago *" : "Plazo (Fecha) *"}
            error={
              esPorMontoCheque
                ? errors.fechaPago?.message
                : errors.plazo?.message
            }
            disabled={mostrarResultados}
            {...register(esPorMontoCheque ? "fechaPago" : "plazo")}
          />
        </div>
      </div>

      {/* ACCIONES Y RESULTADOS */}
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
            <button type="button" className={styles.cancelBtn}>
              Desisto de avanzar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

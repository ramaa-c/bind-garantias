import React from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { Button, InputMonto, SelectFecha, TicketSimulacion } from "../../../ui";
import styles from "./Paso1SimuladorPagare.module.css";

export default function Paso1SimuladorPagare({
  simulacionLista,
  setSimulacionLista,
  handleCalcularSimulacion,
  setPasoActual,
}) {
  const { register, watch, control, trigger } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  
  const montoValue = watch("monto");
  const fechaValue = watch("fechaPago");
  const isMontoValid = !errors.monto && dirtyFields.monto;

  const onSimularClick = async () => {
    const camposValidos = await trigger(["monto", "fechaPago"]);
    
    if (camposValidos) {
      handleCalcularSimulacion();
    }
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
        <SelectFecha
          name="fechaPago"
          label="Fecha de pago"
          disabled={simulacionLista}
          error={errors.fechaPago?.message}
        />
      </div>

      <div className={styles.mainForm}>
        {/* MONTO */}
        <div className={styles.montoSection}>
          <InputMonto
            label="Monto del Pagaré"
            error={errors.monto?.message}
            disabled={simulacionLista}
            esValido={isMontoValid || montoValue > 0}
            {...register("monto")}
          />
        </div>
      </div>

      {!simulacionLista ? (
        <div className={styles.calcBtnWrapper}>
          <Button
            variant="primary"
            size="lg"
            onClick={onSimularClick}
          >
            SIMULAR COSTOS
          </Button>
        </div>
      ) : (
        <TicketSimulacion
          netoRecibir={`USD ${(montoValue * 0.96).toLocaleString("es-AR")}`}
          filasCostos={[
            { label: "Comisión SGR", value: "USD 811" },
            { label: "Descuento operado", value: "USD 446" },
            { label: "Derecho mercado", value: "USD 24" },
            { label: "IVA", value: "USD 5" },
          ]}
          totalCostos="USD 1.286"
          textoAlerta={
            <>
              <strong>IMPORTANTE:</strong> Tasa de interés utilizada para el
              cálculo: % TNA (cierre al día hábil cambiario anterior).
            </>
          }
          onRecalcular={() => setSimulacionLista(false)}
          onContinuar={() => setPasoActual(2)}
        />
      )}
    </div>
  );
}
import React from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FiDollarSign } from "react-icons/fi";
import {
  Button,
  InputMonto,
  SelectFecha,
  SelectSocio,
  TicketSimulacion,
} from "../../../ui";
import { useMonedas } from "../../../../hooks/useCatalogos";
import styles from "./Paso1SimuladorPagare.module.css";

export default function Paso1SimuladorPagare({
  simulacionLista,
  setSimulacionLista,
  handleCalcularSimulacion,
  setPasoActual,
}) {
  const { control, trigger } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const { data: monedasData, isLoading: cargandoMonedas } = useMonedas();
  const opcionesMoneda = monedasData?.opciones || [];

  const montoValue = useWatch({ control, name: "monto" });
  const monedaValue = useWatch({ control, name: "moneda", defaultValue: "" });
  const isMontoValid = !errors.monto && dirtyFields.monto;

  const simboloActual =
    monedasData?.raw.find((m) => m.monedaid.toString() === monedaValue)
      ?.simbolo || "$";

  const isValidSelection = (error, val) => {
    if (error) return false;
    if (val === undefined || val === null) return false;
    const strVal = String(val).trim();
    return strVal !== "" && strVal !== "0";
  };

  const onSimularClick = async () => {
    const camposValidos = await trigger(["moneda", "monto", "fechaPago"]);
    if (camposValidos) {
      handleCalcularSimulacion();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        {/* MONEDA */}
        <SelectSocio
          name="moneda"
          control={control}
          label={cargandoMonedas ? "Cargando..." : "Moneda de operación"}
          icon={<FiDollarSign />}
          options={opcionesMoneda}
          disabled={simulacionLista || cargandoMonedas}
          error={errors.moneda?.message}
          esValido={isValidSelection(errors.moneda, monedaValue)}
        />

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
            name="monto"
            control={control}
            label="Monto del Pagaré"
            currency={simboloActual}
            error={errors.monto?.message}
            disabled={simulacionLista}
            esValido={isMontoValid || montoValue > 0}
          />
        </div>
      </div>

      {!simulacionLista ? (
        <div className={styles.calcBtnWrapper}>
          <Button variant="primary" size="lg" onClick={onSimularClick}>
            SIMULAR COSTOS
          </Button>
        </div>
      ) : (
        <TicketSimulacion
          netoRecibir={`${simboloActual} ${(montoValue * 0.96).toLocaleString("es-AR")}`}
          filasCostos={[
            { label: "Comisión SGR", value: `${simboloActual} 811` },
            { label: "Descuento operado", value: `${simboloActual} 446` },
            { label: "Derecho mercado", value: `${simboloActual} 24` },
            { label: "IVA", value: `${simboloActual} 5` },
          ]}
          totalCostos={`${simboloActual} 1.286`}
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

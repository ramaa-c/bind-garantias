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

const defaultParametros = {
  lineas: {
    tasaGeneral: 35.5,
    montoMinimo: 1000000,
    montoMaximo: 500000000,
    comisionOtorgamiento: 1.5,
  },
  cheques: {
    tasaGeneral: 43.34,
    montoMinimo: 50000,
    montoMaximo: 25000000,
    comisionOtorgamiento: 2.5,
    derechoMercado: 0.0476,
    arancelBolsa: 0.2219,
    valoresCobro: 6000,
    gestionCobro: 70,
  },
  pagares: {
    tasaGeneral: 32.0,
    montoMinimo: 500000,
    montoMaximo: 150000000,
    comisionOtorgamiento: 2.0275,
    derechoMercado: 0.06,
    arancelBolsa: 1.115,
  },
  prestamos: {
    tasaGeneral: 44.0,
    montoMinimo: 2000000,
    montoMaximo: 80000000,
    comisionBanco: 1.0,
    comisionSgr: 2.0,
  },
};

const getRatesConfig = () => {
  const stored = localStorage.getItem("tasas_y_montos_config");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const merged = { ...defaultParametros };
      Object.keys(defaultParametros).forEach((key) => {
        merged[key] = { ...defaultParametros[key], ...parsed[key] };
      });
      return merged;
    } catch (e) {
      console.error("Error parsing stored config", e);
    }
  }
  return defaultParametros;
};

const calculateDays = (dateStr) => {
  if (!dateStr) return 90;
  let dateObj;
  
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date(dateStr);
  }
  
  if (isNaN(dateObj.getTime())) return 90;
  
  const diffTime = dateObj.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 90;
};

export default function Paso1SimuladorPagare({
  simulacionLista,
  setSimulacionLista,
  handleCalcularSimulacion,
  setPasoActual,
}) {
  const { control, trigger, setError } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const { data: monedasData, isLoading: cargandoMonedas } = useMonedas();
  const opcionesMoneda = monedasData?.opciones || [];

  const montoValue = useWatch({ control, name: "monto" });
  const monedaValue = useWatch({ control, name: "moneda", defaultValue: "" });
  const fechaPagoValue = useWatch({ control, name: "fechaPago", defaultValue: "" });
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

  const config = getRatesConfig();
  const activeParams = config.pagares;

  const onSimularClick = async () => {
    const camposValidos = await trigger(["moneda", "monto", "fechaPago"]);
    if (camposValidos) {
      if (activeParams) {
        const montoNum = Number(montoValue);
        if (montoNum < activeParams.montoMinimo) {
          setError("monto", {
            type: "manual",
            message: `El monto mínimo es ${simboloActual} ${new Intl.NumberFormat("es-AR").format(activeParams.montoMinimo)}`,
          });
          return;
        }
        if (montoNum > activeParams.montoMaximo) {
          setError("monto", {
            type: "manual",
            message: `El monto máximo es ${simboloActual} ${new Intl.NumberFormat("es-AR").format(activeParams.montoMaximo)}`,
          });
          return;
        }
      }
      handleCalcularSimulacion();
    }
  };

  // --- DYNAMIC CALCULATION FOR PAGARE ---
  const dias = fechaPagoValue ? calculateDays(fechaPagoValue) : 90;
  const sgrVal = montoValue * (activeParams.comisionOtorgamiento / 100);
  const descuentoVal = montoValue * (activeParams.tasaGeneral / 100) * (dias / 365);
  const mercadoVal = montoValue * (activeParams.derechoMercado / 100);
  const arancelVal = montoValue * (activeParams.arancelBolsa / 100);
  const ivaVal = (sgrVal + mercadoVal + arancelVal) * 0.21;
  const totalCostosNum = sgrVal + descuentoVal + mercadoVal + arancelVal + ivaVal;
  const netoRecibirNum = montoValue - totalCostosNum;

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
          netoRecibir={`${simboloActual} ${netoRecibirNum.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          filasCostos={[
            { label: `Comisión SGR (${activeParams.comisionOtorgamiento}%)`, value: `${simboloActual} ${sgrVal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: `Descuento operado (${activeParams.tasaGeneral}% TNA)`, value: `${simboloActual} ${descuentoVal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: `Derecho mercado (${activeParams.derechoMercado}%)`, value: `${simboloActual} ${mercadoVal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: `Arancel Soc. Bolsa (${activeParams.arancelBolsa}%)`, value: `${simboloActual} ${arancelVal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: "IVA (21%)", value: `${simboloActual} ${ivaVal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          ]}
          totalCostos={`${simboloActual} ${totalCostosNum.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          textoAlerta={
            <>
              <strong>IMPORTANTE:</strong> Tasa de interés utilizada para el
              cálculo: {activeParams.tasaGeneral}% TNA (cierre al día hábil cambiario anterior).
            </>
          }
          onRecalcular={() => setSimulacionLista(false)}
          onContinuar={() => setPasoActual(2)}
        />
      )}
    </div>
  );
}

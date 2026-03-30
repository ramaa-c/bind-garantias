import React, { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import {
  Button,
  InputMonto,
  SelectFecha,
  Select,
  TicketSimulacion,
} from "../../../ui";
import styles from "./Paso3Simulador.module.css";

const opcionesMoneda = [
  { value: "Pesos", label: "Pesos" },
  { value: "Dolares", label: "Dólares" },
];

const opcionesCalculo = [
  { value: "por_monto_factura", label: "Por monto de factura" },
  { value: "por_monto_cheque", label: "Por monto de cheque" },
];

export default function Paso3Simulador({
  mostrarResultados,
  onCalcular,
  onContinuar,
  onCancelar,
  opcionesProducto,
  mostrarTipoCalculo = true,
  labelFecha = "Fecha de pago",
  labelMonto = "Monto",
}) {
  const { register, control, trigger, setError, clearErrors, setValue, getValues } =
    useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const isMontoValid = !errors.monto && dirtyFields.monto;

  const tipoCalculo = useWatch({ control, name: "tipoCalculo", defaultValue: "" });
  const esPorMontoCheque = tipoCalculo === "por_monto_cheque";
  const campoFecha = esPorMontoCheque ? "fechaPago" : "plazo";

  const montoValue = useWatch({ control, name: "monto" });

  useEffect(() => {
    if (opcionesProducto?.length === 1) {
      setValue("tipoProducto", opcionesProducto[0].value, {
        shouldValidate: false,
      });
    }
  }, [opcionesProducto, setValue]);

  const handleLocalCalcular = async () => {
    const camposATrigger = ["moneda", "monto", "tipoProducto"];
    if (mostrarTipoCalculo) camposATrigger.push("tipoCalculo");

    const esValido = await trigger(camposATrigger);

    const valorFecha = getValues(campoFecha);
    if (!valorFecha || valorFecha.trim() === "") {
      setError(campoFecha, {
        type: "manual",
        message: esPorMontoCheque
          ? "La fecha de pago es requerida"
          : "El plazo es requerido",
      });
      return;
    } else {
      clearErrors(campoFecha);
    }

    if (esValido) {
      onCalcular();
    }
  };

  return (
    <div className={styles.container}>
      {!mostrarResultados && (
        <h2 className={styles.headerTitle}>
          Selecciona el monto y tipo de financiación que necesitas
        </h2>
      )}

      <div className={styles.topGrid}>
        <Select
          name="moneda"
          control={control}
          label="Moneda"
          placeholder="Seleccione moneda"
          options={opcionesMoneda}
          disabled={mostrarResultados}
          error={errors.moneda?.message}
        />

        <Select
          name="tipoProducto"
          control={control}
          label="Tipo de producto"
          placeholder="Seleccione producto"
          options={opcionesProducto}
          disabled={mostrarResultados}
          error={errors.tipoProducto?.message}
        />

        {mostrarTipoCalculo && (
          <Select
            name="tipoCalculo"
            control={control}
            label="Tipo de cálculo"
            placeholder="Seleccione tipo"
            options={opcionesCalculo}
            disabled={mostrarResultados}
            error={errors.tipoCalculo?.message}
          />
        )}

        <SelectFecha
          name={campoFecha}
          label={labelFecha}
          disabled={mostrarResultados}
          error={errors[campoFecha]?.message}
        />
      </div>

      <div className={styles.mainForm}>
        <div className={styles.montoSection}>
          <InputMonto
            label={labelMonto}
            esValido={isMontoValid || montoValue > 0}
            error={errors.monto?.message}
            disabled={mostrarResultados}
            {...register("monto")}
          />
        </div>
      </div>

      {!mostrarResultados ? (
        <div className={styles.calcBtnWrapper}>
          <Button variant="primary" size="lg" onClick={handleLocalCalcular}>
            CALCULAR
          </Button>
        </div>
      ) : (
        <TicketSimulacion
          netoRecibir="$ 2.712.752"
          filasCostos={[
            { label: "Comisión Garantías (2.5%)", value: "$ 15.822" },
            { label: "Intereses (43.34% TNA*)", value: "$ 254.299" },
            { label: "Derecho bolsa", value: "$ 0" },
            { label: "Derecho mercado (0.06%)", value: "$ 1.428" },
            { label: "Arancel Soc Bolsa", value: "$ 6.658" },
            { label: "Valores al cobro", value: "$ 6.000" },
            { label: "Gestión de cobro", value: "$ 70" },
            { label: "IVA", value: "$ 2.973" },
          ]}
          totalCostos="$ 287.248"
          datoExtraTotal={{ label: "CFT estimado", value: "49.55% anual" }}
          datosResumen={[
            {
              label: esPorMontoCheque ? "Vto del cheque" : "Plazo estimado",
              value: "31/07/2026",
            },
            {
              label: esPorMontoCheque
                ? "Monto del cheque"
                : "Monto a financiar",
              value: "$ 3.000.000",
            },
          ]}
          textoAlerta="Tasa promocional subvencionada. IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa."
          onRecalcular={onCancelar}
          onContinuar={onContinuar}
          textoBotonSecundario="Desisto de avanzar"
        />
      )}
    </div>
  );
}

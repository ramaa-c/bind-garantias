import React, { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import {
  Button,
  InputMonto,
  SelectFecha,
  Select,
  TicketSimulacion,
  TicketPrestamoFijo,
} from "../../../ui";
import styles from "./Paso3Simulador.module.css";

const opcionesMoneda = [
  { value: "Pesos", label: "Pesos" },
  { value: "Dolares", label: "Dólares" },
];

const defaultOpcionesCalculo = [
  { value: "por_monto_factura", label: "Por monto de factura" },
  { value: "por_monto_cheque", label: "Por monto de cheque" },
];

export default function Paso3Simulador({
  mostrarResultados,
  onCalcular,
  onContinuar,
  onCancelar,
  opcionesProducto,
  opcionesCalculo = defaultOpcionesCalculo,
  mostrarTipoCalculo = true,
  mostrarMonto = true,
  mostrarFecha = true,
  textoAccion = "CALCULAR",
  labelFecha = "Fecha de pago",
  labelMonto = "Monto",
  usarTicketPrestamoFijo = false,
}) {
  const {
    register,
    control,
    trigger,
    setError,
    clearErrors,
    setValue,
    getValues,
  } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const isMontoValid = !errors.monto && dirtyFields.monto;

  const tipoCalculo = useWatch({
    control,
    name: "tipoCalculo",
    defaultValue: "",
  });
  const esFechaEspecifica =
    tipoCalculo === "por_monto_cheque" || tipoCalculo === "por_monto_pagare";
  const campoFecha = esFechaEspecifica ? "fechaPago" : "plazo";

  const montoValue = useWatch({ control, name: "monto" });

  useEffect(() => {
    if (opcionesProducto?.length === 1) {
      setValue("tipoProducto", opcionesProducto[0].value, {
        shouldValidate: false,
      });
    }
  }, [opcionesProducto, setValue]);

  useEffect(() => {
    if (opcionesCalculo?.length === 1 && mostrarTipoCalculo) {
      setValue("tipoCalculo", opcionesCalculo[0].value, {
        shouldValidate: false,
      });
    }
  }, [opcionesCalculo, setValue, mostrarTipoCalculo]);

  const handleLocalCalcular = async () => {
    const camposATrigger = ["moneda", "tipoProducto"];
    if (mostrarMonto) camposATrigger.push("monto");
    if (mostrarTipoCalculo) camposATrigger.push("tipoCalculo");

    const esValido = await trigger(camposATrigger);

    if (mostrarFecha) {
      const valorFecha = getValues(campoFecha);
      if (!valorFecha || valorFecha.trim() === "") {
        setError(campoFecha, {
          type: "manual",
          message: esFechaEspecifica
            ? "La fecha de pago es requerida"
            : "El plazo es requerido",
        });
        return;
      } else {
        clearErrors(campoFecha);
      }
    }

    if (esValido) {
      onCalcular();
    }
  };

  return (
    <div className={styles.container}>
      {!mostrarResultados && (
        <h2 className={styles.headerTitle}>
          Selecciona el tipo de financiación que necesitas
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

        {mostrarFecha && (
          <SelectFecha
            name={campoFecha}
            label={labelFecha}
            disabled={mostrarResultados}
            error={errors[campoFecha]?.message}
          />
        )}
      </div>

      {mostrarMonto && (
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
      )}

      {!mostrarResultados ? (
        <div className={styles.calcBtnWrapper}>
          <Button variant="primary" size="lg" onClick={handleLocalCalcular}>
            {textoAccion}
          </Button>
        </div>
      ) :
      usarTicketPrestamoFijo ? (
        <TicketPrestamoFijo
          datosTabla={[
            {
              plazo: "181 a 360 días",
              conceptos: [
                { label: "Monto hasta", value: "$5.000.000", unidad: "" },
                { label: "Tasa", value: "44%", unidad: "TNA" },
                { label: "Comisión Banco", value: "1%", unidad: "Directo" },
                { label: "Comisión SGR", value: "2%", unidad: "TNA" },
              ],
            },
          ]}
          onContinuar={onContinuar}
          onRecalcular={onCancelar}
        />
      ) : (
        <TicketSimulacion
          netoRecibir="$ 2.712.752"
          filasCostos={[]}
          totalCostos="$ 287.248"
          datoExtraTotal={{ label: "CFT estimado", value: "49.55% anual" }}
          datosResumen={[]}
          textoAlerta="IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa."
          onRecalcular={onCancelar}
          onContinuar={onContinuar}
          textoBotonSecundario="Desisto de avanzar"
        />
      )}
    </div>
  );
}

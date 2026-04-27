import React, { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FiDollarSign, FiBriefcase, FiSliders } from "react-icons/fi";
import {
  Button,
  InputMonto,
  SelectFecha,
  SelectSocio,
  TicketSimulacion,
  TicketPrestamoFijo,
  Modal,
} from "../../../../ui";
import styles from "./Paso3Simulador.module.css";
import {
  useMonedas,
  useTiposProducto,
  useTipoContrato,
} from "../../../../../hooks/useCatalogos";

export default function Paso3Simulador({
  mostrarResultados,
  onCalcular,
  onContinuar,
  onCancelar,
  mostrarTipoCalculo = true,
  mostrarMonto = true,
  mostrarFecha = true,
  textoAccion = "CALCULAR",
  labelFecha = "Fecha de pago",
  labelMonto = "Monto",
  usarTicketPrestamoFijo = false,
  opcionesProducto: propOpcionesProducto,
}) {
  const { control, trigger, setValue } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const errorPlazo = errors?.plazo?.message;

  const { data: monedasData, isLoading: cargandoMonedas } = useMonedas();
  const opcionesMoneda = monedasData?.opciones || [];

  const { data: productosData, isLoading: isLoadingProductos } = useTiposProducto();
  const opcionesProducto = propOpcionesProducto || productosData?.opciones || [];
  const cargandoProductos = !propOpcionesProducto && isLoadingProductos;

  const { data: contratosData, isLoading: cargandoContratos } =
    useTipoContrato();
  const opcionesCalculo = contratosData?.opciones || [];

  const tipoCalculo = useWatch({
    control,
    name: "tipoCalculo",
    defaultValue: "",
  });
  const monedaValue = useWatch({ control, name: "moneda", defaultValue: "" });
  const tipoProductoValue = useWatch({
    control,
    name: "tipoProducto",
    defaultValue: "",
  });
  const montoValue = useWatch({ control, name: "monto" });

  const isMontoValid = !errors.monto && dirtyFields.monto;

  const campoFecha = "plazo";

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

  const simboloActual =
    monedasData?.raw.find((m) => m.monedaid.toString() === monedaValue)
      ?.simbolo || "$";

  const handleLocalCalcular = async () => {
    const camposATrigger = ["moneda", "tipoProducto"];
    if (mostrarMonto) camposATrigger.push("monto");
    if (mostrarTipoCalculo) camposATrigger.push("tipoCalculo");
    if (mostrarFecha) camposATrigger.push(campoFecha);

    const esValido = await trigger(camposATrigger);
    if (esValido) onCalcular();
  };

  const isValidSelection = (error, val) => {
    if (error) return false;
    if (val === undefined || val === null) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    const strVal = String(val).trim();
    return (
      strVal !== "" &&
      strVal !== "0" &&
      strVal !== "false" &&
      strVal !== "[object Object]"
    );
  };

  // --- CÁLCULOS SIMULADOS BASADOS EN EL MONTO INGRESADO ---
  const montoNumerico = Number(String(montoValue || "0").replace(/\D/g, ""));
  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  // Cálculos para Cheque (basados en la imagen de referencia)
  const comisionBind = montoNumerico * 0.025; // 2.5%
  const intereses = montoNumerico * 0.0847; // 43.34% TNA ajustado al plazo simulado
  const derechoMercado = montoNumerico * 0.000476; // 0.06% aprox
  const arancelBolsa = montoNumerico * 0.002219; 
  const valoresCobro = 6000;
  const gestionCobro = 70;
  const iva = (comisionBind + arancelBolsa + valoresCobro) * 0.21; 
  const totalCostosCheque =
    comisionBind + intereses + derechoMercado + arancelBolsa + valoresCobro + gestionCobro + iva;
  const netoCheque = montoNumerico - totalCostosCheque;

  const filasCostosCheque = [
    { label: "Comisión Bind Garantías (2.5%)", value: formatCurrency(comisionBind) },
    { label: "Intereses (43.34% TNA*)", value: formatCurrency(intereses) },
    { label: "Derecho bolsa", value: "$ 0" },
    { label: "Derecho mercado (0.06%)", value: formatCurrency(derechoMercado) },
    { label: "Arancel Soc Bolsa", value: formatCurrency(arancelBolsa) },
    { label: "Valores al cobro", value: formatCurrency(valoresCobro) },
    { label: "Gestión de cobro", value: formatCurrency(gestionCobro) },
    { label: "IVA", value: formatCurrency(iva) },
  ];

  const datosResumenCheque = [
    { label: "Vto del cheque", value: "31/07/2026" },
    { label: "Monto del cheque", value: formatCurrency(montoNumerico) },
  ];

  // Datos para Préstamo (basados en la imagen de referencia)
  const datosTablaPrestamo = [
    {
      plazo: "181 a 360 días",
      conceptos: [
        { label: "Monto hasta", value: formatCurrency(montoNumerico), unidad: "" },
        { label: "Tasa", value: "44%", unidad: "TNA" },
        { label: "Comisión Banco", value: "1%", unidad: "Directo" },
        { label: "Comisión SGR", value: "2%", unidad: "TNA" },
      ],
    },
  ];

  return (
    <div className={styles.container}>
      {!mostrarResultados && (
        <h2 className={styles.headerTitle}>
          Selecciona el tipo de financiación que necesitas
        </h2>
      )}

      <div className={styles.topGrid}>
        <SelectSocio
          name="moneda"
          control={control}
          label={cargandoMonedas ? "Cargando..." : "Moneda"}
          icon={<FiDollarSign />}
          options={opcionesMoneda}
          disabled={mostrarResultados || cargandoMonedas}
          error={errors.moneda?.message}
          esValido={isValidSelection(errors.moneda, monedaValue)}
        />

        <SelectSocio
          name="tipoProducto"
          control={control}
          label={cargandoProductos ? "Cargando..." : "Tipo de producto"}
          icon={<FiBriefcase />}
          options={opcionesProducto}
          disabled={mostrarResultados || cargandoProductos}
          error={errors.tipoProducto?.message}
          esValido={isValidSelection(errors.tipoProducto, tipoProductoValue)}
        />

        {mostrarTipoCalculo && (
          <SelectSocio
            name="tipoCalculo"
            control={control}
            label={cargandoContratos ? "Cargando..." : "Tipo de cálculo"}
            icon={<FiSliders />}
            options={opcionesCalculo}
            disabled={mostrarResultados || cargandoContratos}
            error={errors.tipoCalculo?.message}
            esValido={isValidSelection(errors.tipoCalculo, tipoCalculo)}
          />
        )}

        {mostrarFecha && (
          <SelectFecha
            key={campoFecha}
            name={campoFecha}
            label={labelFecha}
            disabled={mostrarResultados}
            error={errorPlazo}
          />
        )}
      </div>

      {mostrarMonto && (
        <div className={styles.mainForm}>
          <div className={styles.montoSection}>
            <InputMonto
              name="monto"
              control={control}
              label={labelMonto}
              currency={simboloActual}
              esValido={isMontoValid || montoValue > 0}
              error={errors.monto?.message}
              disabled={mostrarResultados}
            />
          </div>
        </div>
      )}

      <div className={styles.calcBtnWrapper}>
        <Button variant="primary" size="lg" onClick={handleLocalCalcular}>
          {textoAccion}
        </Button>
      </div>

      <Modal 
        isOpen={mostrarResultados} 
        onClose={onCancelar} 
        title="Resultado de la Simulación"
        maxWidth="800px"
      >
        {usarTicketPrestamoFijo || tipoProductoValue === "prestamo" ? (
          <TicketPrestamoFijo
            datosTabla={datosTablaPrestamo}
            onContinuar={onContinuar}
            onRecalcular={onCancelar}
          />
        ) : (
          <TicketSimulacion
            netoRecibir={formatCurrency(netoCheque)}
            filasCostos={filasCostosCheque}
            totalCostos={formatCurrency(totalCostosCheque)}
            datoExtraTotal={{ label: "CFT estimado", value: "49,55% anual" }}
            datosResumen={datosResumenCheque}
            textoAlerta="IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa."
            onRecalcular={onCancelar}
            onContinuar={onContinuar}
            textoBotonSecundario="Desisto de avanzar"
          />
        )}
      </Modal>
    </div>
  );
}

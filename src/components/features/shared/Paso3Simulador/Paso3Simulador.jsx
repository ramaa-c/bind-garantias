import React, { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FiDollarSign, FiBriefcase, FiSliders, FiChevronRight } from "react-icons/fi";
import {
  Button,
  InputMonto,
  SelectFecha,
  SelectSocio,
  TicketSimulacion,
  TicketPrestamoFijo,
  Modal,
} from "../../../ui";
import styles from "./Paso3Simulador.module.css";
import {
  useMonedas,
  useTiposProducto,
  useTipoContrato,
} from "../../../../hooks/useCatalogos";

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
  opcionesMoneda: propOpcionesMoneda,
  opcionesCalculo: propOpcionesCalculo,
  disableTipoCalculo = false,
  disableTipoProducto = false,
}) {
  const { control, trigger, setValue } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const errorPlazo = errors?.plazo?.message;

  const { data: monedasData, isLoading: cargandoMonedas } = useMonedas();
  const opcionesMoneda = propOpcionesMoneda || monedasData?.opciones || [];

  const { data: productosData, isLoading: isLoadingProductos } =
    useTiposProducto();
  const opcionesProducto =
    propOpcionesProducto || productosData?.opciones || [];
  const cargandoProductos = !propOpcionesProducto && isLoadingProductos;

  const { data: contratosData, isLoading: cargandoContratos } =
    useTipoContrato();
  const opcionesCalculo = propOpcionesCalculo || contratosData?.opciones || [];

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
  const isMontoFactura = tipoCalculo === "monto_factura";
  const isDolarPagare = tipoProductoValue === "pagare" && monedaValue === "2";
  const montoNumerico = Number(montoValue) || 0;
  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const formatDolar = (val) =>
    "USD " +
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  let netoCheque, totalCostosCheque, filasCostosCheque, datosResumenCheque, datoExtraTotal, textoAlerta;

  if (isDolarPagare) {
    const factor = (montoNumerico || 40000) / 40000;
    netoCheque = 38713 * factor;
    totalCostosCheque = 1287 * factor;

    const sgr = 811 * factor;
    const descuento = 446 * factor;
    const mercado = 24 * factor;
    const bolsa = 0;
    const iva = 5 * factor;

    filasCostosCheque = [
      { label: "Comisión SGR", value: formatDolar(sgr) },
      { label: "Descuento operado", value: formatDolar(descuento) },
      { label: "Derecho mercado", value: formatDolar(mercado) },
      { label: "Derecho bolsa", value: formatDolar(bolsa) },
      { label: "IVA", value: formatDolar(iva) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: "2.95% anual" };

    datosResumenCheque = [
      { label: "Vto del pagaré", value: "31/05/2023" },
      { label: "Monto del pagaré", value: formatDolar(montoNumerico || 40000) },
    ];

    textoAlerta = (
      <>
        Tasa promocional subvencionada por Syngenta. Con cupos y por tiempo limitado
        <br /><br />
        <strong>IMPORTANTE</strong>
        <br /><br />
        Tasa de interés utilizada para el cálculo: % TNA (cierre al día hábil cambiario anterior).
      </>
    );
  } else if (isMontoFactura) {
    netoCheque = montoNumerico;

    // Proporciones basadas en el ticket de $2.000.000
    const intereses = montoNumerico * 0.1301315;
    const subsidio = montoNumerico * -0.01;
    const bonificacion = montoNumerico * -0.02507;
    const comisionBind = montoNumerico * 0.015965;
    const derechoMercado = montoNumerico * 0.0090305;
    const arancelBolsa = montoNumerico * 0.0053215;
    const valoresCobro = montoNumerico * 0.0206635;
    const iva = montoNumerico * 0.0073535;
    const descuentoTope = montoNumerico * -0.1248375;

    totalCostosCheque =
      intereses +
      subsidio +
      bonificacion +
      comisionBind +
      derechoMercado +
      arancelBolsa +
      valoresCobro +
      iva +
      descuentoTope;

    const montoDelCheque = netoCheque + totalCostosCheque;

    filasCostosCheque = [
      { label: "Intereses (27,98% TNA*)", value: formatCurrency(intereses) },
      { label: "Subsidio (-1,00% directo)", value: formatCurrency(subsidio) },
      { label: "Bonificación de puntos de tasa (-6,00% TNA)", value: formatCurrency(bonificacion) },
      { label: "Comisión Bind Garantías (3,00% TNA)", value: formatCurrency(comisionBind) },
      { label: "Derecho de mercado (1,00%)", value: formatCurrency(derechoMercado) },
      { label: "Comisión sociedad de bolsa (1,00% TNA)", value: formatCurrency(arancelBolsa) },
      { label: "Valores al cobro Caja de Valores** (2,00%)", value: formatCurrency(valoresCobro) },
      { label: "IVA (21,00%)", value: formatCurrency(iva) },
      { label: "Descuento por tope de tasa (1,00%)", value: formatCurrency(descuentoTope) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: "-11.22% anual" };

    datosResumenCheque = [
      { label: "Vto del cheque", value: "31/10/2026" },
      { label: "Monto del cheque", value: formatCurrency(montoDelCheque) },
    ];

    textoAlerta = (
      <>
        Tasa promocional subvencionada por John Deere. Con cupos y por tiempo limitado
        <br /><br />
        ********** TEST ** TEST ** TEST **********
        <br /><br />
        Dado que el tipo de cambio y la tasa de interés varían diariamente, los valores expresados son indicativos al solo efecto de permitir estimar el monto del cheque a emitir.
        <br /><br />
        Nuevo disclaimer
        <br /><br />
        ********** TEST ** ** TEST **********
        <br /><br />
        IMPORTANTE
        <br /><br />
        La tasa de interés utilizada en el simulador es estimativa.
      </>
    );
  } else {
    const comisionBind = montoNumerico * 0.025;
    const intereses = montoNumerico * 0.0847;
    const derechoMercado = montoNumerico * 0.000476;
    const arancelBolsa = montoNumerico * 0.002219;
    const valoresCobro = 6000;
    const gestionCobro = 70;
    const iva = (comisionBind + arancelBolsa + valoresCobro) * 0.21;
    totalCostosCheque =
      comisionBind +
      intereses +
      derechoMercado +
      arancelBolsa +
      valoresCobro +
      gestionCobro +
      iva;
    netoCheque = montoNumerico - totalCostosCheque;

    filasCostosCheque = [
      {
        label: "Comisión Bind Garantías (2.5%)",
        value: formatCurrency(comisionBind),
      },
      { label: "Intereses (43.34% TNA*)", value: formatCurrency(intereses) },
      { label: "Derecho bolsa", value: "$ 0" },
      { label: "Derecho mercado (0.06%)", value: formatCurrency(derechoMercado) },
      { label: "Arancel Soc Bolsa", value: formatCurrency(arancelBolsa) },
      { label: "Valores al cobro", value: formatCurrency(valoresCobro) },
      { label: "Gestión de cobro", value: formatCurrency(gestionCobro) },
      { label: "IVA", value: formatCurrency(iva) },
    ];

    datosResumenCheque = [
      { label: "Vto del cheque", value: "31/07/2026" },
      { label: "Monto del cheque", value: formatCurrency(montoNumerico) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: "49,55% anual" };
    textoAlerta = "IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa.";
  }

  const datosTablaPrestamo = [
    {
      plazo: "181 a 360 días",
      conceptos: [
        {
          label: "Monto hasta",
          value: formatCurrency(montoNumerico),
          unidad: "",
        },
        { label: "Tasa", value: "44%", unidad: "TNA" },
        { label: "Comisión Banco", value: "1%", unidad: "Directo" },
        { label: "Comisión SGR", value: "2%", unidad: "TNA" },
      ],
    },
  ];

  return (
    <div className={styles.container}>
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
          disabled={mostrarResultados || cargandoProductos || disableTipoProducto}
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
            disabled={mostrarResultados || cargandoContratos || disableTipoCalculo}
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
        <Button
          variant="primary"
          size="md"
          onClick={handleLocalCalcular}
          className={styles.continueBtn}
        >
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
            netoRecibir={isDolarPagare ? formatDolar(netoCheque) : formatCurrency(netoCheque)}
            filasCostos={filasCostosCheque}
            totalCostos={isDolarPagare ? formatDolar(totalCostosCheque) : formatCurrency(totalCostosCheque)}
            datoExtraTotal={datoExtraTotal}
            datosResumen={datosResumenCheque}
            textoAlerta={textoAlerta}
            onRecalcular={onCancelar}
            onContinuar={onContinuar}
            textoBotonSecundario="Desisto de avanzar"
          />
        )}
      </Modal>
    </div>
  );
}

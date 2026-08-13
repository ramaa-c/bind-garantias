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
  if (!dateStr) return 71.365;
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
  
  if (isNaN(dateObj.getTime())) return 71.365;
  
  const diffTime = dateObj.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 71.365;
};

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
  disableMonto = false,
  montoMaximoOverride,
}) {
  const { control, trigger, setValue, setError } = useFormContext();
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
  const plazoValue = useWatch({ control, name: "plazo", defaultValue: "" });

  const isMontoValid = !errors.monto && dirtyFields.monto;

  const campoFecha = "plazo";

  const config = getRatesConfig();

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
    if (esValido) {
      // Dynamic validation based on localStorage limits
      const activeProduct = tipoProductoValue; // cheques, pagares, prestamos
      const productParams = config[activeProduct];
      const montoNum = Number(montoValue);
      // montoMaximoOverride es el techo real de la línea elegida
      // (TipoLimiteCadenaValor.MontoLinea) - cuando está presente manda por
      // sobre el montoMaximo simulado/local de config[activeProduct].
      const montoMaximoEfectivo =
        montoMaximoOverride > 0 ? montoMaximoOverride : productParams?.montoMaximo;

      if (productParams && montoNum < productParams.montoMinimo) {
        setError("monto", {
          type: "manual",
          message: `El monto mínimo es ${simboloActual} ${new Intl.NumberFormat("es-AR").format(productParams.montoMinimo)}`,
        });
        return;
      }
      if (montoMaximoEfectivo > 0 && montoNum > montoMaximoEfectivo) {
        setError("monto", {
          type: "manual",
          message: `El monto máximo es ${simboloActual} ${new Intl.NumberFormat("es-AR").format(montoMaximoEfectivo)}`,
        });
        return;
      }
      onCalcular();
    }
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

  // --- CÁLCULOS SIMULADOS BASADOS EN EL MONTO INGRESADO Y LA CONFIGURACIÓN ---
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
    const activeParams = config.pagares;
    const sgrPct = activeParams.comisionOtorgamiento / 100;
    const dias = plazoValue ? calculateDays(plazoValue) : 90;
    const descuentoPct = (activeParams.tasaGeneral / 100) * (dias / 365);
    const mercadoPct = activeParams.derechoMercado / 100;

    const sgrVal = montoNumerico * sgrPct;
    const descuentoVal = montoNumerico * descuentoPct;
    const mercadoVal = montoNumerico * mercadoPct;
    const ivaVal = (sgrVal + mercadoVal) * 0.21;
    const derechoBolsa = 0;

    totalCostosCheque = sgrVal + descuentoVal + mercadoVal + ivaVal;
    netoCheque = montoNumerico - totalCostosCheque;

    filasCostosCheque = [
      { label: `Comisión SGR (${activeParams.comisionOtorgamiento}%)`, value: formatDolar(sgrVal) },
      { label: `Descuento operado (${activeParams.tasaGeneral}% TNA)`, value: formatDolar(descuentoVal) },
      { label: `Derecho mercado (${activeParams.derechoMercado}%)`, value: formatDolar(mercadoVal) },
      { label: "Derecho bolsa", value: formatDolar(derechoBolsa) },
      { label: "IVA (21%)", value: formatDolar(ivaVal) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: `${((totalCostosCheque / montoNumerico) * (365 / dias) * 100).toFixed(2)}% anual` };

    datosResumenCheque = [
      { label: "Vto del pagaré", value: plazoValue ? new Date(plazoValue).toLocaleDateString("es-AR") : "31/05/2023" },
      { label: "Monto del pagaré", value: formatDolar(montoNumerico) },
    ];

    textoAlerta = (
      <>
        Tasa promocional subvencionada por Syngenta. Con cupos y por tiempo limitado
        <br /><br />
        <strong>IMPORTANTE</strong>
        <br /><br />
        Tasa de interés utilizada para el cálculo: {activeParams.tasaGeneral}% TNA (cierre al día hábil cambiario anterior).
      </>
    );
  } else if (isMontoFactura) {
    const activeParams = config.cheques;
    netoCheque = montoNumerico;

    const dias = plazoValue ? calculateDays(plazoValue) : 71.365;
    const intereses = montoNumerico * (activeParams.tasaGeneral / 100) * (dias / 365);
    const subsidio = montoNumerico * -0.01;
    const bonificacion = montoNumerico * (-6.0 / 100) * (dias / 365);
    const comisionBind = montoNumerico * (activeParams.comisionOtorgamiento / 100);
    const derechoMercado = montoNumerico * (activeParams.derechoMercado / 100);
    const arancelBolsa = montoNumerico * (activeParams.arancelBolsa / 100);
    const valoresCobro = activeParams.valoresCobro * (montoNumerico / 2000000);
    const iva = (comisionBind + arancelBolsa + valoresCobro) * 0.21;
    const descuentoTope = montoNumerico * -0.1248375 * (dias / 71.365);

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
      { label: `Intereses (${activeParams.tasaGeneral}% TNA*)`, value: formatCurrency(intereses) },
      { label: "Subsidio (-1,00% directo)", value: formatCurrency(subsidio) },
      { label: "Bonificación de puntos de tasa (-6,00% TNA)", value: formatCurrency(bonificacion) },
      { label: `Comisión Bind Garantías (${activeParams.comisionOtorgamiento}%)`, value: formatCurrency(comisionBind) },
      { label: `Derecho de mercado (${activeParams.derechoMercado}%)`, value: formatCurrency(derechoMercado) },
      { label: `Comisión sociedad de bolsa (${activeParams.arancelBolsa}%)`, value: formatCurrency(arancelBolsa) },
      { label: `Valores al cobro Caja de Valores** ($${activeParams.valoresCobro} base)`, value: formatCurrency(valoresCobro) },
      { label: "IVA (21,00%)", value: formatCurrency(iva) },
      { label: "Descuento por tope de tasa (1,00%)", value: formatCurrency(descuentoTope) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: `${((totalCostosCheque / montoNumerico) * (365 / dias) * 100).toFixed(2)}% anual` };

    datosResumenCheque = [
      { label: "Vto del cheque", value: plazoValue ? new Date(plazoValue).toLocaleDateString("es-AR") : "31/10/2026" },
      { label: "Monto del cheque", value: formatCurrency(montoDelCheque) },
    ];

    textoAlerta = (
      <>
        Tasa promocional subvencionada por John Deere. Con cupos y por tiempo limitado
        <br /><br />
        Dado que el tipo de cambio y la tasa de interés varían diariamente, los valores expresados son indicativos al solo efecto de permitir estimar el monto del cheque a emitir.
        <br /><br />
        La tasa de interés utilizada en el simulador es estimativa.
      </>
    );
  } else {
    const activeParams = config.cheques;
    const dias = plazoValue ? calculateDays(plazoValue) : 71.365;

    const comisionBind = montoNumerico * (activeParams.comisionOtorgamiento / 100);
    const intereses = montoNumerico * (activeParams.tasaGeneral / 100) * (dias / 365);
    const derechoMercado = montoNumerico * (activeParams.derechoMercado / 100);
    const arancelBolsa = montoNumerico * (activeParams.arancelBolsa / 100);
    const valoresCobro = activeParams.valoresCobro;
    const gestionCobro = activeParams.gestionCobro;
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
        label: `Comisión Bind Garantías (${activeParams.comisionOtorgamiento}%)`,
        value: formatCurrency(comisionBind),
      },
      { label: `Intereses (${activeParams.tasaGeneral}% TNA*)`, value: formatCurrency(intereses) },
      { label: "Derecho bolsa", value: "$ 0" },
      { label: `Derecho mercado (${activeParams.derechoMercado}%)`, value: formatCurrency(derechoMercado) },
      { label: `Arancel Soc Bolsa (${activeParams.arancelBolsa}%)`, value: formatCurrency(arancelBolsa) },
      { label: "Valores al cobro", value: formatCurrency(valoresCobro) },
      { label: "Gestión de cobro", value: formatCurrency(gestionCobro) },
      { label: "IVA", value: formatCurrency(iva) },
    ];

    datosResumenCheque = [
      { label: "Vto del cheque", value: plazoValue ? new Date(plazoValue).toLocaleDateString("es-AR") : "31/07/2026" },
      { label: "Monto del cheque", value: formatCurrency(montoNumerico) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: `${((totalCostosCheque / montoNumerico) * (365 / dias) * 100).toFixed(2)}% anual` };
    textoAlerta = "IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa.";
  }

  const prestamosConfig = config.prestamos;
  const datosTablaPrestamo = [
    {
      plazo: "181 a 360 días",
      conceptos: [
        {
          label: "Monto hasta",
          value: formatCurrency(montoNumerico),
          unidad: "",
        },
        { label: "Tasa", value: `${prestamosConfig.tasaGeneral}%`, unidad: "TNA" },
        { label: "Comisión Banco", value: `${prestamosConfig.comisionBanco}%`, unidad: "Directo" },
        { label: "Comisión SGR", value: `${prestamosConfig.comisionSgr}%`, unidad: "TNA" },
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
              disabled={mostrarResultados || disableMonto}
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

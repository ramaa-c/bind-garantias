import React, { useEffect } from "react";
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { FiSliders } from "react-icons/fi";
import { Button, InputMonto, SelectFecha, SelectSocio } from "../../../ui";
import SelectorLinea from "./SelectorLinea";
import styles from "./Paso3Simulador.module.css";
import {
  useMonedas,
  useTiposProducto,
  useTipoContrato,
} from "../../../../hooks/useCatalogos";
import { simboloMoneda, esMonedaPesos } from "../../../../utils/monedaUtils";

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

// Rediseño 2026-10: la simulación ya no se abre en un modal al tocar
// "Calcular" - se recalcula en vivo en un panel lateral (debajo del
// formulario en mobile, con una barra fija abajo) y "Enviar solicitud" corre
// las mismas validaciones de monto que antes hacía Calcular, y si pasan,
// envía directamente (onContinuar).
export default function Paso3Simulador({
  onContinuar,
  mostrarTipoCalculo = true,
  mostrarMonto = true,
  mostrarFecha = true,
  labelFecha = "Fecha de pago",
  labelMonto = "Monto",
  opcionesProducto: propOpcionesProducto,
  opcionesMoneda: propOpcionesMoneda,
  opcionesCalculo: propOpcionesCalculo,
  disableTipoCalculo = false,
  disableTipoProducto = false,
  disableMonto = false,
  montoMaximoOverride,
  isSubmitting = false,
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
      ?.simbolo || simboloMoneda(monedaValue);
  const enPesos = esMonedaPesos(monedaValue);

  const handleEnviar = async () => {
    if (isSubmitting) return;
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
      onContinuar();
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
    enPesos
      ? new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val)
      : `${simboloActual} ${new Intl.NumberFormat("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val)}`;

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
    const valoresCobro = enPesos ? activeParams.valoresCobro * (montoNumerico / 2000000) : 0;
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
    const valoresCobro = enPesos ? activeParams.valoresCobro : 0;
    const gestionCobro = enPesos ? activeParams.gestionCobro : 0;
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
      { label: "Derecho bolsa", value: formatCurrency(0) },
      { label: `Derecho mercado (${activeParams.derechoMercado}%)`, value: formatCurrency(derechoMercado) },
      { label: `Arancel Soc Bolsa (${activeParams.arancelBolsa}%)`, value: formatCurrency(arancelBolsa) },
      ...(enPesos
        ? [
            { label: "Valores al cobro", value: formatCurrency(valoresCobro) },
            { label: "Gestión de cobro", value: formatCurrency(gestionCobro) },
          ]
        : []),
      { label: "IVA", value: formatCurrency(iva) },
    ];

    datosResumenCheque = [
      { label: "Vto del cheque", value: plazoValue ? new Date(plazoValue).toLocaleDateString("es-AR") : "31/07/2026" },
      { label: "Monto del cheque", value: formatCurrency(montoNumerico) },
    ];

    datoExtraTotal = { label: "CFT estimado", value: `${((totalCostosCheque / montoNumerico) * (365 / dias) * 100).toFixed(2)}% anual` };
    textoAlerta = enPesos
      ? "IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa."
      : "IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa. Los gastos fijos en pesos (valores al cobro y gestión de cobro) no se incluyen en esta estimación.";
  }

  // Con una sola moneda disponible no hay nada que elegir: queda
  // seleccionada siempre (también si el valor guardado no corresponde a
  // ninguna opción, ej. un borrador viejo de sessionStorage).
  const unicaMoneda =
    opcionesMoneda.length === 1 ? String(opcionesMoneda[0].value) : null;
  useEffect(() => {
    if (unicaMoneda && String(monedaValue) !== unicaMoneda) {
      setValue("moneda", unicaMoneda, { shouldValidate: true });
    }
  }, [unicaMoneda, monedaValue, setValue]);

  // Si al cambiar de moneda la línea elegida ya no está entre las opciones
  // (son las de esa moneda), se limpia en vez de quedar seleccionada "a
  // escondidas".
  useEffect(() => {
    if (
      tipoProductoValue &&
      opcionesProducto.length > 0 &&
      !opcionesProducto.some((o) => String(o.value) === String(tipoProductoValue))
    ) {
      setValue("tipoProducto", "", { shouldValidate: false });
    }
  }, [opcionesProducto, tipoProductoValue, setValue]);

  const simulacionLista = !!tipoProductoValue && montoNumerico > 0;
  const fmt = (val) => (isDolarPagare ? formatDolar(val) : formatCurrency(val));
  const netoTexto = simulacionLista ? fmt(netoCheque) : "—";

  return (
    <div className={styles.container}>
      <div className={styles.columnaForm}>
        <section className={styles.seccion} aria-labelledby="alta-linea-titulo">
          <div className={styles.seccionHead}>
            <h2 id="alta-linea-titulo" className={styles.seccionTitulo}>
              1. Línea
              {opcionesProducto.length > 0 && (
                <span className={styles.seccionMeta}>
                  {" "}
                  · {opcionesProducto.length}{" "}
                  {opcionesProducto.length === 1 ? "disponible" : "disponibles"}
                </span>
              )}
            </h2>

            {opcionesMoneda.length > 0 && (
              <Controller
                name="moneda"
                control={control}
                render={({ field }) => (
                  <div
                    role="group"
                    aria-label="Moneda"
                    className={styles.monedaToggle}
                  >
                    {opcionesMoneda.map((op) => {
                      const activa = String(field.value) === String(op.value);
                      return (
                        <button
                          key={op.value}
                          type="button"
                          aria-pressed={activa}
                          disabled={cargandoMonedas || isSubmitting}
                          onClick={() => field.onChange(String(op.value))}
                          className={`${styles.monedaOpcion} ${activa ? styles.monedaActiva : ""}`}
                        >
                          {op.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            )}
          </div>

          {cargandoProductos ? (
            <p className={styles.lineasVacio}>Cargando líneas...</p>
          ) : (
            <Controller
              name="tipoProducto"
              control={control}
              render={({ field }) => (
                <SelectorLinea
                  opciones={opcionesProducto}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.tipoProducto?.message}
                  disabled={disableTipoProducto || isSubmitting}
                  labelledBy="alta-linea-titulo"
                />
              )}
            />
          )}
          {errors.moneda?.message && (
            <span className={styles.errorTexto}>{errors.moneda.message}</span>
          )}
          {errors.tipoProducto?.message && (
            <span className={styles.errorTexto}>
              {errors.tipoProducto.message}
            </span>
          )}
        </section>

        <section className={styles.seccion} aria-labelledby="alta-cond-titulo">
          <h2 id="alta-cond-titulo" className={styles.seccionTitulo}>
            2. Condiciones
          </h2>
          <div className={styles.condiciones}>
            {mostrarMonto && (
              <div className={styles.condicionMonto}>
                <InputMonto
                  name="monto"
                  control={control}
                  label={labelMonto}
                  currency={simboloActual}
                  esValido={isMontoValid || montoValue > 0}
                  error={errors.monto?.message}
                  disabled={disableMonto || isSubmitting}
                  locked={disableMonto}
                  lockedMessage="Este es el monto disponible de tu línea de crédito: se completa automáticamente y no se puede modificar."
                />
              </div>
            )}

            {mostrarFecha && (
              <SelectFecha
                key={campoFecha}
                name={campoFecha}
                label={labelFecha}
                disabled={isSubmitting}
                error={errorPlazo}
              />
            )}

            {mostrarTipoCalculo && (
              <SelectSocio
                name="tipoCalculo"
                control={control}
                label={cargandoContratos ? "Cargando..." : "Tipo de cálculo"}
                icon={<FiSliders />}
                options={opcionesCalculo}
                disabled={cargandoContratos || disableTipoCalculo || isSubmitting}
                error={errors.tipoCalculo?.message}
                esValido={isValidSelection(errors.tipoCalculo, tipoCalculo)}
              />
            )}
          </div>
        </section>
      </div>

      <aside className={styles.panel} aria-labelledby="alta-sim-titulo">
        <div className={styles.panelHead}>
          <h2 id="alta-sim-titulo" className={styles.panelTitulo}>
            Simulación
          </h2>
          <span className={styles.panelTag}>Estimada</span>
        </div>

        {simulacionLista ? (
          <>
            <div className={styles.netoBox}>
              <span className={styles.netoLabel}>Neto a recibir</span>
              <strong className={styles.netoValor}>{netoTexto}</strong>
              {datoExtraTotal && (
                <span className={styles.netoExtra}>
                  {datoExtraTotal.label}{" "}
                  <strong>{datoExtraTotal.value}</strong>
                </span>
              )}
            </div>

            <dl className={styles.costos}>
              {filasCostosCheque.map((fila) => (
                <div key={fila.label} className={styles.costoFila}>
                  <dt>{fila.label}</dt>
                  <dd>{fila.value}</dd>
                </div>
              ))}
              <div className={`${styles.costoFila} ${styles.costoTotal}`}>
                <dt>Total de costos</dt>
                <dd>{fmt(totalCostosCheque)}</dd>
              </div>
            </dl>

            <div className={styles.resumenGrid}>
              {datosResumenCheque.map((dato) => (
                <div key={dato.label} className={styles.resumenItem}>
                  <span>{dato.label}</span>
                  <strong>{dato.value}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.panelVacio}>
            <strong>
              {tipoProductoValue ? "Ingresá un monto" : "Elegí una línea"}
            </strong>
            <span>
              Vas a ver acá cuánto recibís, los costos y el CFT estimado.
            </span>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleEnviar}
          isLoading={isSubmitting}
          disabled={isSubmitting || !simulacionLista}
          className={styles.panelCta}
        >
          {isSubmitting ? "ENVIANDO..." : "Enviar solicitud"}
        </Button>

        {simulacionLista && textoAlerta && (
          <div className={styles.panelNota}>{textoAlerta}</div>
        )}
        {!simulacionLista && (
          <p className={styles.panelNota}>
            La tasa de interés utilizada en el simulador es estimativa.
          </p>
        )}
      </aside>

      {/* Mobile/tablet: el panel queda debajo del formulario, así que el neto
          y la acción se repiten en una barra fija abajo para no tener que
          scrollear hasta el final para enviar. */}
      <div className={styles.barraMovil}>
        <div className={styles.barraNeto}>
          <span>Neto a recibir</span>
          <strong>{netoTexto}</strong>
        </div>
        <Button
          variant="primary"
          onClick={handleEnviar}
          isLoading={isSubmitting}
          disabled={isSubmitting || !simulacionLista}
          className={styles.barraCta}
        >
          {isSubmitting ? "ENVIANDO..." : "Enviar solicitud"}
        </Button>
      </div>
    </div>
  );
}

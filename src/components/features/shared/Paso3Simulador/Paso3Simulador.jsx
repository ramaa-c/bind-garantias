import React, { useEffect } from "react";
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { FiSliders } from "react-icons/fi";
import { Button, InputMonto, SelectFecha, SelectSocio, Skeleton } from "../../../ui";
import SelectorLinea from "./SelectorLinea";
import styles from "./Paso3Simulador.module.css";
import {
  useMonedas,
  useTiposProducto,
  useTipoContrato,
} from "../../../../hooks/useCatalogos";
import { simboloMoneda, esMonedaPesos } from "../../../../utils/monedaUtils";

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
      const montoNum = Number(montoValue);
      if (montoMaximoOverride > 0 && montoNum > montoMaximoOverride) {
        setError("monto", {
          type: "manual",
          message: `El monto máximo es ${simboloActual} ${new Intl.NumberFormat("es-AR").format(montoMaximoOverride)}`,
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

  const solicitudLista = !!tipoProductoValue && montoNumerico > 0;
  const montoTexto = montoNumerico > 0 ? formatCurrency(montoNumerico) : "—";
  const lineaElegida = opcionesProducto.find((o) => String(o.value) === String(tipoProductoValue));
  const plazoTexto = plazoValue ? new Date(plazoValue).toLocaleDateString("es-AR") : null;

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
            <div className={styles.lineasTarjetas} aria-busy="true" aria-label="Cargando líneas">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={styles.lineaTarjeta}>
                  <Skeleton width="2.5rem" height="2.5rem" radius="0.625rem" />
                  <span className={styles.lineaTexto}>
                    <Skeleton width="8rem" height="0.9rem" />
                    <Skeleton width="11rem" height="0.7rem" style={{ marginTop: "0.35rem" }} />
                  </span>
                </div>
              ))}
            </div>
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

      <aside className={styles.panel} aria-labelledby="alta-resumen-titulo">
        <div className={styles.panelHead}>
          <h2 id="alta-resumen-titulo" className={styles.panelTitulo}>
            Resumen
          </h2>
        </div>

        {solicitudLista ? (
          <>
            <div className={styles.netoBox}>
              <span className={styles.netoLabel}>{labelMonto}</span>
              <strong className={styles.netoValor}>{montoTexto}</strong>
            </div>

            <div className={styles.resumenGrid}>
              <div className={styles.resumenItem}>
                <span>Línea</span>
                <strong>{lineaElegida?.label || "—"}</strong>
              </div>
              {plazoTexto && (
                <div className={styles.resumenItem}>
                  <span>{labelFecha.replace(" (opcional)", "")}</span>
                  <strong>{plazoTexto}</strong>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.panelVacio}>
            <strong>
              {tipoProductoValue ? "Ingresá un monto" : "Elegí una línea"}
            </strong>
            <span>Vas a ver acá el resumen de lo que vas a solicitar.</span>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleEnviar}
          isLoading={isSubmitting}
          disabled={isSubmitting || !solicitudLista}
          className={styles.panelCta}
        >
          {isSubmitting ? "ENVIANDO..." : "Enviar solicitud"}
        </Button>

        <p className={styles.panelNota}>
          BIND Garantías va a evaluar tu solicitud y te avisamos el resultado.
        </p>
      </aside>

      <div className={styles.barraMovil}>
        <div className={styles.barraNeto}>
          <span>{labelMonto}</span>
          <strong>{montoTexto}</strong>
        </div>
        <Button
          variant="primary"
          onClick={handleEnviar}
          isLoading={isSubmitting}
          disabled={isSubmitting || !solicitudLista}
          className={styles.barraCta}
        >
          {isSubmitting ? "ENVIANDO..." : "Enviar solicitud"}
        </Button>
      </div>
    </div>
  );
}

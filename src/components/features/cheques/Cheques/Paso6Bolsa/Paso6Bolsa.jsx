import React, { useMemo, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiBriefcase, FiArrowRight } from "react-icons/fi";
import { InputSocioMasked, Button, SelectSocio } from "../../../../ui";
import styles from "./Paso6Bolsa.module.css";
import { useTipoTerceroRelacionado } from "../../../../../hooks/useCatalogos";

export default function Paso6Bolsa({ avanzarConBolsa, avanzarSinBolsa, isSubmitting }) {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  const {
    data: tercerosData,
    isLoading,
    isError,
  } = useTipoTerceroRelacionado();

  const opcionesSociedades = useMemo(() => {
    if (!tercerosData?.raw) return [];

    return tercerosData.raw
      .filter((t) => t.descripcion.toUpperCase().includes("VENDORS"))
      .map((t) => ({
        value: t.tipotercerorelacionadoid.toString(),
        label: t.descripcion.replace(/Vendors /i, "").trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tercerosData]);

  const sociedadSeleccionadaId = useWatch({
    control,
    name: "sociedadBolsa",
    defaultValue: "",
  });

  const cuentaBolsa = useWatch({
    control,
    name: "numeroCuentaBolsa",
    defaultValue: "",
  });

  const nombreSociedadSeleccionada = useMemo(() => {
    const soc = opcionesSociedades.find(
      (o) => o.value === sociedadSeleccionadaId,
    );
    return soc ? soc.label : "";
  }, [sociedadSeleccionadaId, opcionesSociedades]);

  useEffect(() => {
    setValue("numeroCuentaBolsa", "");
  }, [sociedadSeleccionadaId, setValue]);

  const esSeleccionValida =
    sociedadSeleccionadaId !== "" && !errors.sociedadBolsa;

  return (
    <div className={styles.container}>


      <div className={styles.topGrid}>
        <SelectSocio
          name="sociedadBolsa"
          control={control}
          label={isLoading ? "Cargando sociedades..." : "Sociedad de Bolsa"}
          icon={<FiBriefcase />}
          options={
            isLoading
              ? [{ value: "", label: "Cargando..." }]
              : opcionesSociedades
          }
          disabled={isLoading || isError}
          error={errors.sociedadBolsa?.message}
          esValido={esSeleccionValida}
        />
      </div>

      {isError && (
        <p
          className={styles.errorText}
          style={{ color: "red", marginTop: "10px" }}
        >
          No se pudieron cargar las sociedades. Intentá nuevamente.
        </p>
      )}

      {sociedadSeleccionadaId && (
        <div className={styles.expandedArea}>
          <div className={styles.inputWrapper}>
            <InputSocioMasked
              label={`Número de cuenta en ${nombreSociedadSeleccionada}`}
              esValido={cuentaBolsa.length >= 4}
              error={errors.numeroCuentaBolsa?.message}
              control={control}
              name="numeroCuentaBolsa"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.actionWrapper}>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={avanzarConBolsa}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? "FINALIZANDO..." : "CONFIRMAR Y FINALIZAR"}
            </Button>
          </div>
        </div>
      )}

      <div className={styles.altSection}>
        <p className={styles.altText}>
          ¿No tenés cuenta en ninguna de las opciones anteriores?
        </p>
        <div className={styles.altButtonWrapper}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={avanzarSinBolsa}
            disabled={isSubmitting}
          >
            CONTINUAR SIN SOCIEDAD DE BOLSA{" "}
            {!isSubmitting && <FiArrowRight className={styles.iconRight} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

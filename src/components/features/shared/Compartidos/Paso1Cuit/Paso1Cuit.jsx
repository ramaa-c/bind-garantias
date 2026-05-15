import React, { useState } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { BuscadorCuit } from "../../../../ui";
import { sociosService } from "../../../../../services/sociosService";
import { useValidarCuitAfip } from "../../../../../hooks/useAfip";
import { useValidarFormatoCuit } from "../../../../../hooks/useSocios";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar, onSocioExistente }) {
  const { control, getValues, setValue, setError } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const { mutateAsync: validarAfip, isPending: isLoadingAfip } =
    useValidarCuitAfip();
  const { mutateAsync: validarFormatoBackend, isPending: isLoadingFormato } =
    useValidarFormatoCuit();
  const [isValidatingSocio, setIsValidatingSocio] = useState(false);

  const isCuitValid = !errors.cuit && dirtyFields.cuit;

  const handleValidar = async () => {
    const cuit = getValues("cuit");
    if (!cuit) return;

    setIsValidatingSocio(true);
    try {
      // VALIDACIÓN DE FORMATO
      try {
        const respuestaFormato = await validarFormatoBackend(cuit);
        if (respuestaFormato === false || respuestaFormato?.isValid === false) {
          setError("cuit", {
            type: "manual",
            message:
              respuestaFormato?.message || "El formato del CUIT es inválido.",
          });
          return;
        }
      } catch (formatoError) {
        setError("cuit", {
          type: "manual",
          message:
            formatoError?.response?.data?.message ||
            formatoError?.response?.data ||
            "El CUIT ingresado no es válido.",
        });
        return;
      }

      const respSgr = await sociosService.obtenerSocios({
        Cuit: cuit,
        page: 1,
        page_size: 10,
      });
      const socioSgrDb = Array.isArray(respSgr)
        ? respSgr[0]
        : respSgr?.items?.[0] || respSgr?.data?.[0];

      if (socioSgrDb) {
        setError("cuit", {
          type: "manual",
          message: "Esta empresa ya se encuentra en gestión por SGR+",
        });
        return;
      }

      // VALIDACIÓN CONTRA ESQUEMA WEB
      const respWeb = await sociosService.obtenerSociosWeb({ Cuit: cuit });
      const socioWebDb = Array.isArray(respWeb)
        ? respWeb[0]
        : respWeb?.items?.[0] || respWeb?.data?.[0];

      if (socioWebDb && socioWebDb.socioid) {
        if (onSocioExistente) onSocioExistente(socioWebDb);
        return;
      }

      // VALIDACIÓN CONTRA AFIP
      const afipData = await validarAfip(cuit);

      if (afipData && afipData.datosgenerales) {
        const dg = afipData.datosgenerales;

        const nombreCompleto =
          dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim();
        setValue("razonSocial", nombreCompleto, { shouldValidate: true });

        const dom = dg.domiciliofiscal || {};
        setValue("direccion", dom.direccion || "", { shouldValidate: true });
        setValue("localidad", dom.localidad || "", { shouldValidate: true });
        setValue("provincia", dom.descripcionprovincia || "", {
          shouldValidate: true,
        });

        if (onValidar) onValidar();
      } else {
        setError("cuit", {
          type: "manual",
          message: "No se encontraron datos válidos en AFIP",
        });
      }
    } catch (err) {
      console.error("Error validando CUIT:", err);
      setError("cuit", {
        type: "manual",
        message: "Error al procesar la validación del CUIT",
      });
    } finally {
      setIsValidatingSocio(false);
    }
  };

  const isLoading = isValidatingSocio || isLoadingAfip || isLoadingFormato;

  return (
    <div className={styles.pasoContainer}>
      <div className={styles.decorativeBanner} style={{ minHeight: "3.75rem" }}>
        <div className={styles.bannerIcon}>
          <svg
            width="1rem"
            height="1rem"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>Proceso 100% seguro y online</p>
          <p className={styles.bannerSub}>
            Tu información es validada en tiempo real contra AFIP
          </p>
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <BuscadorCuit
          name="cuit"
          control={control}
          label="CUIT de la empresa"
          onValidar={handleValidar}
          error={errors.cuit?.message}
          esValido={isCuitValid}
          buttonText="VALIDAR CUIT"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

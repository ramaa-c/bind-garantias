import React, { useState } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { BuscadorCuit } from "../../../../ui";
import { sociosService } from "../../../../../services/sociosService";
import { useValidarCuitAfip } from "../../../../../hooks/useAfip";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar }) {
  const { control, getValues, setValue, setError } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const { mutateAsync: validarAfip, isPending: isLoadingAfip } =
    useValidarCuitAfip();
  const [isValidatingSocio, setIsValidatingSocio] = useState(false);

  const isCuitValid = !errors.cuit && dirtyFields.cuit;

  const handleValidar = async () => {
    const cuit = getValues("cuit");
    if (!cuit) return;

    setIsValidatingSocio(true);
    try {
      const resp = await sociosService.obtenerSocios({
        Cuit: cuit,
        page: 1,
        page_size: 10,
      });
      const socioDb = Array.isArray(resp)
        ? resp[0]
        : resp?.items?.[0] || resp?.data?.[0];

      if (socioDb) {
        setError("cuit", {
          type: "manual",
          message: "Esta empresa ya se encuentra en gestión",
        });
        return;
      }

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

        if (onValidar) {
          onValidar();
        }
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
        message: "Error al validar el CUIT con AFIP",
      });
    } finally {
      setIsValidatingSocio(false);
    }
  };

  const isLoading = isValidatingSocio || isLoadingAfip;

  return (
    <div className={styles.pasoContainer}>
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

      <div className={styles.decorativeBanner} style={{ minHeight: "60px" }}>
        <div className={styles.bannerIcon}>
          <svg
            width="16"
            height="16"
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
    </div>
  );
}

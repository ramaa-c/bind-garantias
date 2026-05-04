import React from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { BuscadorCuit } from "../../../../ui";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar, isLoading }) {
  const { control } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const isCuitValid = !errors.cuit && dirtyFields.cuit;

  return (
    <div className={styles.pasoContainer}>
      <div className={styles.inputWrapper}>
        <BuscadorCuit
          name="cuit"
          control={control}
          label="CUIT de la empresa"
          onValidar={onValidar}
          error={errors.cuit?.message}
          esValido={isCuitValid}
          buttonText="VALIDAR CUIT"
          isLoading={isLoading}
        />
      </div>

      <div className={styles.decorativeBanner}>
        <div className={styles.bannerIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>Proceso 100% seguro y online</p>
          <p className={styles.bannerSub}>Tu información es validada en tiempo real contra AFIP</p>
        </div>
      </div>
    </div>
  );
}
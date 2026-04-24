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
  );
}
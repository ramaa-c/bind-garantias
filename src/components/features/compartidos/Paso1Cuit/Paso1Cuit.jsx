import React from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { InputFlotante, Button } from "../../../ui";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar }) {
  const { register, control } = useFormContext();
  
  const { errors, dirtyFields } = useFormState({ control }); 

  const isCuitValid = !errors.cuit && dirtyFields.cuit;

  return (
    <div className={styles.searchContainerVertical}>
      <div className={styles.searchInputFull}>
        <InputFlotante
          label="CUIT de la empresa *"
          type="text"
          maxLength={11}
          esValido={isCuitValid}
          error={errors.cuit?.message}
          {...register("cuit")}
        />
      </div>

      <div className={styles.buttonWrapperCentered}>
        <Button variant="primary" size="lg" onClick={onValidar}>
          VALIDAR CUIT
        </Button>
      </div>
    </div>
  );
}

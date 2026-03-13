import React from "react";
import { useFormContext } from "react-hook-form";
import { InputFlotante, Button } from "../../../ui";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const cuitValue = watch("cuit") || "";




  const isCuitValid = /^\d{11}$/.test(cuitValue) && !errors.cuit;

  return (
    <div className={styles.searchContainerVertical}>
      <div className={styles.searchInputFull}>
        <InputFlotante
          label="CUIT de la empresa"
          maxLength={11}
          esValido={isCuitValid}
          error={errors.cuit?.message}
          {...register("cuit")}
        />
      </div>

      <div className={styles.buttonWrapperCentered}>
        <Button
          variant="primary"
          size="lg"
          onClick={onValidar}
        >
          VALIDAR CUIT
        </Button>
      </div>
    </div>
  );
}
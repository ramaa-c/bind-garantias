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
  const isCuitValid = cuitValue.length === 11 && !errors.cuit;

  return (
    <div className={styles.container} style={{ alignItems: "flex-start" }}>
      
      <div className={styles.inputWrapper} style={{ marginTop: "35px" }}>
        <InputFlotante
          label="CUIT"
          maxLength={11}
          esValido={isCuitValid}
          error={errors.cuit?.message}
          {...register("cuit")} /* <--- Limpio, sin el onChange raro */
        />
      </div>

      <div className={styles.btnWrapper}>
        <Button type="button" variant="primary" onClick={onValidar}>
          VALIDAR CUIT
        </Button>
      </div>

    </div>
  );
}
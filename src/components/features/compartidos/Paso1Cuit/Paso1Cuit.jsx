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

  // 1. Usamos el nombre correcto del campo que registramos abajo ("cuit")
  const cuitValue = watch("cuit") || "";
  
  // 2. La variable para el tilde verde se llama isCuitValid
  const isCuitValid = cuitValue.length === 11 && !errors.cuit;

  return (
   <div className={styles.searchContainerVertical}>
  <div className={styles.searchInputFull}>
    <InputFlotante
      label="CUIT"
      maxLength={11}
      esValido={isCuitValid}
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
import React from "react";
import { useFormContext } from "react-hook-form";
import { Input, Button } from "../../../ui";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={styles.container}>
      
      <div className={styles.inputWrapper}>
        <Input
          label="CUIT *"
          placeholder="Ingresá tu CUIT (11 números)"
          error={errors.cuit?.message}
          {...register("cuit")}
        />
      </div>

      <div className={styles.btnWrapper}>
        <Button 
          type="button" 
          variant="primary" 
          onClick={onValidar}
        >
          VALIDAR CUIT
        </Button>
      </div>

    </div>
  );
}
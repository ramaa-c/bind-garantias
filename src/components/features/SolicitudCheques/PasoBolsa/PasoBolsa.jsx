import React from "react";
import { useFormContext } from "react-hook-form";
import { Button, Select } from "../../../ui";
import styles from "./PasoBolsa.module.css";

const OPCIONES_BOLSA = [
  { value: "Industrial Valores S.A.", label: "Industrial Valores S.A." },
  { value: "Tarallo S.A.", label: "Tarallo S.A." },
  { value: "Otra Sociedad", label: "Otra Sociedad de Bolsa" },
];

export default function PasoBolsa({ avanzarConBolsa }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={styles.container}>
      <div className={styles.headerTitleRow}>
        <h3 className={styles.headerTitle}>Por favor, seleccioná la sociedad de bolsa con la que deseás operar.</h3>
      </div>

      <div className={styles.formContainer}>
        <div style={{ maxWidth: "400px" }}>
          <Select
            name="sociedadBolsa"
            control={control}
            label="Sociedad de Bolsa"
            options={OPCIONES_BOLSA}
            error={errors.sociedadBolsa?.message}
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="primary"
            onClick={avanzarConBolsa}
          >
            CONTINUAR
          </Button>
        </div>
      </div>
    </div>
  );
}
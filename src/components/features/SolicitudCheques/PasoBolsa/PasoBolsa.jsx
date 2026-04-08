import React from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "../../../ui";
import styles from "./PasoBolsa.module.css";

export default function PasoBolsa({ avanzarConBolsa }) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const bolsaSeleccionada = watch("sociedadBolsa");

  return (
    <div className={styles.container}>
      <div className={styles.headerTitleRow}>
        <h3 className={styles.headerTitle}>Por favor, seleccioná la sociedad de bolsa con la que deseás operar.</h3>

      </div>

      <div className={styles.formContainer}>
        <div className={styles.selectWrapper}>
          <label htmlFor="sociedadBolsa" className={styles.selectLabel}>
            Sociedad de Bolsa
          </label>
          <div className={styles.customSelectContainer}>
            <select
              id="sociedadBolsa"
              className={`${styles.customSelect} ${errors.sociedadBolsa ? styles.errorSelect : ""}`}
              {...register("sociedadBolsa", { required: "Seleccioná una sociedad de bolsa" })}
            >
              <option value="" disabled hidden>
                Seleccione...
              </option>
              <option value="Industrial Valores S.A.">Industrial Valores S.A.</option>
              <option value="Tarallo S.A.">Tarallo S.A.</option>
              <option value="Otra Sociedad">Otra Sociedad de Bolsa</option>
            </select>
            {/* Flechita personalizada para el select */}
            <div className={styles.selectArrow}></div>
          </div>
          {errors.sociedadBolsa && (
            <span className={styles.errorText}>{errors.sociedadBolsa.message}</span>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="primary"
            onClick={avanzarConBolsa}
            disabled={!bolsaSeleccionada}
          >
            CONTINUAR
          </Button>
        </div>
      </div>
    </div>
  );
}
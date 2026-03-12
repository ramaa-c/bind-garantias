import React from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { InputFlotante, Button } from "../../../ui";
import styles from "./Paso2Datos.module.css";

export default function Paso2Datos({ onVolver, onAbrirModalSms, onContinuar }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const cuitIngresado = watch("cuit", "");

  const dirValue = watch("direccion") || "";
  const provValue = watch("provincia") || "";
  const locValue = watch("localidad") || "";
  const celValue = watch("celular") || "";

 const isDirValid = dirValue.trim().length >= 3 && !errors.direccion;
  const isProvValid = provValue.trim().length >= 3 && !errors.provincia;
  const isLocValid = locValue.trim().length >= 3 && !errors.localidad;
  const isCelValid = celValue.trim().length === 10 && !errors.celular;

  return (
    <div className={styles.container}>
      
      <div className={styles.summaryCard}>
        <div className={styles.summaryInfo}>
          <div className={styles.summaryStatus}>
            <FiCheckCircle size={16} />
            <span>CUIT Validado</span>
          </div>
          <p className={styles.summaryCuit}>{cuitIngresado}</p>
          <p className={styles.summaryName}>EMPRESA DE PRUEBA S.A.</p>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={onVolver}
          className={styles.btnEditGhost}
        >
          <FiEdit2 size={14} className={styles.iconMarginRight} /> Editar
        </Button>
      </div>

      <h3 className={styles.subtitle}>
        Verificá y actualizá la información en caso de ser necesario
      </h3>

      {/* Margen a 70px según tu ajuste visual */}
      <div className={styles.formGroup} style={{ marginTop: "70px" }}>
        <InputFlotante 
          label="Dirección"
          esValido={isDirValid}
          error={errors.direccion?.message}
          {...register("direccion")} 
        />
      </div>

      <div className={styles.formRow} style={{ marginTop: "70px" }}>
        <div className={styles.formCol}>
          <InputFlotante 
            label="Provincia"
            esValido={isProvValid}
            error={errors.provincia?.message}
            {...register("provincia")} 
          />
        </div>
        <div className={styles.formCol}>
          <InputFlotante 
            label="Localidad"
            esValido={isLocValid}
            error={errors.localidad?.message}
            {...register("localidad")} 
          />
        </div>
      </div>

      <div className={styles.phoneZone} style={{ marginTop: "70px", alignItems: "flex-start" }}>
        <div className={styles.phoneInputWrapper}>
          <InputFlotante 
            label="Celular (Sin 15 ni 0)"
            maxLength={10}
            esValido={isCelValid}
            error={errors.celular?.message}
            {...register("celular")} 
          />
        </div>
        
        <div style={{ marginTop: "4px" }}>
          <Button
            type="button"
            variant="outline"
            onClick={onAbrirModalSms}
            className={`${styles.btnVerify} ${errors.celular ? styles.btnVerifyError : ""}`}
          >
            VERIFICAR SMS
          </Button>
        </div>
      </div>

      <div className={styles.actionsRight} style={{ marginTop: "30px" }}>
        <Button type="button" variant="primary" onClick={onContinuar}>
          CONTINUAR
        </Button>
      </div>

    </div>
  );
}
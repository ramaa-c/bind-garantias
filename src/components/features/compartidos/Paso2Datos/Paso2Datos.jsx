import React from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { Input, Button } from "../../../ui";
import styles from "./Paso2Datos.module.css";

export default function Paso2Datos({ onVolver, onAbrirModalSms, onContinuar }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const cuitIngresado = watch("cuit", "");

  return (
    <div className={styles.container}>
      
      {/* Tarjeta de Resumen */}
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

      {/* Fila 1: Dirección */}
      <div className={styles.formGroup}>
        <Input 
          label="Dirección *"
          error={errors.direccion?.message}
          {...register("direccion")} 
        />
      </div>

      {/* Fila 2: Provincia y Localidad */}
      <div className={styles.formRow}>
        <div className={styles.formCol}>
          <Input 
            label="Provincia *"
            error={errors.provincia?.message}
            {...register("provincia")} 
          />
        </div>
        <div className={styles.formCol}>
          <Input 
            label="Localidad *"
            error={errors.localidad?.message}
            {...register("localidad")} 
          />
        </div>
      </div>

      {/* Zona Celular y Verificación */}
      <div className={styles.phoneZone}>
        <div className={styles.phoneInputWrapper}>
          <Input 
            label="Celular *"
            placeholder="Sin 15 y cód. área sin 0"
            error={errors.celular?.message}
            {...register("celular")} 
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={onAbrirModalSms}
          className={`${styles.btnVerify} ${errors.celular ? styles.btnVerifyError : ""}`}
        >
          VERIFICAR SMS
        </Button>
      </div>

      {/* Acción Principal */}
      <div className={styles.actionsRight}>
        <Button type="button" variant="primary" onClick={onContinuar}>
          CONTINUAR
        </Button>
      </div>

    </div>
  );
}
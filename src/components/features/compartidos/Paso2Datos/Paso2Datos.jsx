import React from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { InputFlotante, Button } from "../../../ui";
import styles from "./Paso2Datos.module.css";

export default function Paso2Datos({ onVolver, onAbrirModalSms, onContinuar }) {
  const { register, watch, control } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const cuitIngresado = watch("cuit", "");
  const isDirValid = !errors.direccion && dirtyFields.direccion;
  const isProvValid = !errors.provincia && dirtyFields.provincia;
  const isLocValid = !errors.localidad && dirtyFields.localidad;
  const isCelValid = !errors.celular && dirtyFields.celular;

  return (
    <div className={styles.container}>
      
      {/* RESUMEN CUIT */}
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

      {/* SECCIÓN UBICACIÓN */}
      <div className={styles.seccionForm}>
        <h3 className={styles.subtitle}>Datos de Ubicación</h3>
        <div className={styles.formGroup}>
          <InputFlotante 
            label="Dirección"
            esValido={isDirValid}
            error={errors.direccion?.message}
            {...register("direccion")} 
          />
        </div>

        <div className={styles.formRow}>
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
      </div>

      <div className={styles.phoneZone}>
        <h3 className={styles.subtitleContacto}>Datos de Contacto</h3> 
        <div className={styles.phoneRow}>
          <div className={styles.phoneInputWrapper}>
            <InputFlotante 
              label="Celular (Sin 15 ni 0)"
              maxLength={10}
              esValido={isCelValid}
              error={errors.celular?.message}
              {...register("celular")} 
            />
          </div>
          
          <div className={styles.btnVerifyWrapper}>
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
      </div>

      <div className={styles.actionsRight}>
        <Button type="button" variant="primary" onClick={onContinuar}>
          CONTINUAR
        </Button>
      </div>

    </div>
  );
}
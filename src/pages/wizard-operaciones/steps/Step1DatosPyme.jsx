import React from 'react';
import { useFormContext } from 'react-hook-form';
import styles from '../WizardOperaciones.module.css';

export const Step1DatosPyme = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className={styles.stepTitle}>Paso 1: Datos de la Empresa</h3>
      
      <div className={styles.inputGroup}>
        <label>CUIT de la Empresa</label>
        <input 
          type="text" 
          className="input-text" 
          placeholder="Ej: 30-12345678-9"
          {...register('cuit', { required: 'El CUIT es obligatorio' })} 
        />
        {errors.cuit && <span className={styles.errorText}>{errors.cuit.message}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label>Razón Social</label>
        <input 
          type="text" 
          className="input-text" 
          placeholder="Ej: Empresa S.A."
          {...register('razonSocial', { required: 'La razón social es obligatoria' })} 
        />
        {errors.razonSocial && <span className={styles.errorText}>{errors.razonSocial.message}</span>}
      </div>
    </div>
  );
};

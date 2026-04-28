import React from 'react';
import { useFormContext } from 'react-hook-form';
import styles from '../WizardOperaciones.module.css';

export const Step2DatosUsuario = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className={styles.stepTitle}>Paso 2: Datos del Usuario Apoderado</h3>
      
      <div className={styles.inputGroup}>
        <label>Nombre y Apellido</label>
        <input 
          type="text" 
          className="input-text" 
          placeholder="Ej: Juan Pérez"
          {...register('nombreUsuario', { required: 'El nombre es obligatorio' })} 
        />
        {errors.nombreUsuario && <span className={styles.errorText}>{errors.nombreUsuario.message}</span>}
      </div>
    </div>
  );
};

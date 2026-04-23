import React from 'react';
import { useFormContext } from 'react-hook-form';
import styles from '../WizardOperaciones.module.css';

export const Step3Calculadora = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className={styles.stepTitle}>Paso 3: Calculadora (El Pivote)</h3>
      <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>
        Seleccione el instrumento financiero que desea operar. Esta decisión cambiará el próximo paso.
      </p>
      
      <div className={styles.inputGroup}>
        <label>Tipo de Instrumento</label>
        <select 
          className="input-text" 
          {...register('tipoInstrumento', { required: 'Seleccione un instrumento para continuar' })}
        >
          <option value="">Seleccione una opción...</option>
          <option value="cheque">Cheque Avalado</option>
          <option value="prestamo">Préstamo</option>
          <option value="pagare">Pagaré Bursátil</option>
        </select>
        {errors.tipoInstrumento && <span className={styles.errorText}>{errors.tipoInstrumento.message}</span>}
      </div>
    </div>
  );
};

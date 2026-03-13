import styles from './BarraProgreso.module.css';

export const BarraProgreso = ({ currentStep, totalSteps = 3 }) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.wrapper}>
      <p className={styles.text}>Paso {currentStep} de {totalSteps}</p>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
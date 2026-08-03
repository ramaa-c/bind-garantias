import React from 'react';
import styles from './AltaOperacion.module.css';

export const AltaOperacionPasos = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Calculadora' },
    { num: 2, label: 'Instrumento' },
    { num: 3, label: 'Bolsa' }
  ];

  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div 
            className={`${styles.stepIndicator} ${
              currentStep === step.num ? styles.active : ''
            } ${currentStep > step.num ? styles.completed : ''}`}
          >
            <div className={styles.stepNumber}>
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span>{step.label}</span>
          </div>
          
          {index < steps.length - 1 && (
            <div className={styles.stepperLine} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

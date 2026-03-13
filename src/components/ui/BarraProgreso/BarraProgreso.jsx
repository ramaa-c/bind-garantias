import styles from './BarraProgreso.module.css';

export const BarraProgreso = ({ 
  hitos = ["Paso 1", "Paso 2", "Paso 3"], 
  hitoActual = 1 
}) => {
  return (
    <div className={styles.wrapper}>
      {hitos.map((hito, index) => {
        const numeroHito = index + 1;
        const isCompleted = hitoActual > numeroHito;
        const isCurrent = hitoActual === numeroHito;

        return (
          <div 
            key={index} 
            className={`${styles.item} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
          >
            <div className={styles.dot}></div>
            <div className={styles.text}>{hito}</div>
          </div>
        );
      })}
    </div>
  );
};
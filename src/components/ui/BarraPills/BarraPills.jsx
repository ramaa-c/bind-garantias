import { FiCheck, FiChevronRight } from "react-icons/fi";
import styles from "./BarraPills.module.css";

export const BarraPills = ({
  hitos = ["Paso 1", "Paso 2"],
  hitoActual = 1,
}) => {
  return (
    <div className={styles.wrapper}>
      {hitos.map((hito, index) => {
        const numero = index + 1;
        const isCompleted = hitoActual > numero;
        const isCurrent = hitoActual === numero;

        return (
          <div key={hito} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              className={`${styles.pill} ${
                isCompleted
                  ? styles.completed
                  : isCurrent
                  ? styles.active
                  : styles.pending
              }`}
            >
              <div className={styles.stepNumber}>
                {isCompleted ? (
                  <FiCheck size={12} className={styles.checkIcon} />
                ) : (
                  numero
                )}
              </div>
              {hito.toUpperCase()}
            </div>

            {index < hitos.length - 1 && (
              <FiChevronRight
                size={14}
                className={`${styles.separator} ${
                  isCompleted ? styles.separatorCompleted : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

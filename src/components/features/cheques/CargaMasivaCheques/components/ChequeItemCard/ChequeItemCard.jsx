import React from "react";
import { FiCheck } from "react-icons/fi";
import styles from "./ChequeItemCard.module.css";

export const ChequeItemCard = ({ cheque, isSelected, onToggle }) => {
  return (
    <div
      className={`${styles.chequeCard} ${isSelected ? styles.selected : ""}`}
      onClick={() => onToggle(cheque.id)}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(cheque.id);
        }
      }}
    >
      <div className={styles.cardContent}>
        {/* Columna Izquierda */}
        <div className={styles.dataGroup}>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Emisor:</span>
            <span className={styles.dataValue}>{cheque.emisor}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Vencimiento:</span>
            <span className={styles.dataValue}>{cheque.vencimiento}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Monto estimado a recibir:</span>
            <span className={styles.dataValue}>
              {cheque.montoEstimado}{" "}
              <span
                className={styles.dataLabel}
                style={{ textTransform: "none" }}
              >
                (CFT: {cheque.cft})
              </span>
            </span>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className={styles.dataGroup}>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Coelsa ID:</span>
            <span className={styles.dataValue}>{cheque.coelsaId}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Monto del cheque:</span>
            <span className={`${styles.dataValue} ${styles.dataHighlight}`}>
              {cheque.montoNominal}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.checkIndicator}>
        <FiCheck size={16} strokeWidth={3} />
      </div>
    </div>
  );
};

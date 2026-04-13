import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import styles from "./ChequeAprobadoCard.module.css";

export const ChequeAprobadoCard = ({ cheque }) => {
  return (
    <div className={styles.chequeCard}>
      <div className={styles.cardContent}>
        {/* Columna Izquierda */}
        <div className={styles.dataGroup}>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Solicitud:</span>
            <span className={styles.dataValue}>{cheque.solicitudId}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Monto del cheque:</span>
            <span className={styles.dataValue}>
              {cheque.montoNominalFormateado}
            </span>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className={styles.dataGroup}>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Emisor:</span>
            <span className={styles.dataValue}>{cheque.emisor}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>CUIT:</span>
            <span className={styles.dataValue}>{cheque.cuit}</span>
          </div>
        </div>
      </div>

      <div className={styles.successIcon}>
        <FiCheckCircle size={28} strokeWidth={2.5} />
      </div>
    </div>
  );
};

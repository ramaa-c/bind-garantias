import React, { useMemo } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { ContenedorPaso, Button } from "../../../ui";
import styles from "./Paso3Confirmacion.module.css";

const ChequeAprobadoCard = ({ cheque }) => {
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

export const Paso3Confirmacion = ({
  chequesAprobados = [],
  onAceptar,
  isSubmitting = false,
}) => {
  const { totalMonto, totalEstimado } = useMemo(() => {
    const sumMonto = chequesAprobados.reduce(
      (acc, curr) => acc + curr.montoNumerico,
      0,
    );
    const sumEstimado = chequesAprobados.reduce(
      (acc, curr) => acc + curr.montoEstimadoNumerico,
      0,
    );

    const formatCurrency = (value) =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(value);

    return {
      totalMonto: formatCurrency(sumMonto),
      totalEstimado: formatCurrency(sumEstimado),
    };
  }, [chequesAprobados]);

  return (
    <ContenedorPaso title="Te confirmamos los cheques que fueron aceptados según nuestros Criterios de Aceptación.">
      <p className={styles.introText}>
        ¡Ya evaluamos los cheques registrados en el archivo!
      </p>

      <div className={styles.listContainer}>
        {chequesAprobados.map((cheque, index) => (
          <ChequeAprobadoCard key={cheque.id || index} cheque={cheque} />
        ))}
      </div>

      {/* Sumatoria final */}
      <div className={styles.summaryBox}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryText}>
            Monto total de cheques, aprobado:
          </span>
          <span className={styles.summaryHighlight}>{totalMonto}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryText}>
            Monto estimado a recibir, aprobado:
          </span>
          <span className={styles.summaryHighlight}>{totalEstimado}</span>
        </div>
      </div>

      {/* Acción Final */}
      <div className={styles.actionFooter}>
        <Button
          variant="primary"
          className={styles.btnAceptar}
          onClick={onAceptar}
          disabled={isSubmitting || chequesAprobados.length === 0}
        >
          {isSubmitting ? "Confirmando..." : "ACEPTAR"}
        </Button>
      </div>
    </ContenedorPaso>
  );
};

import React, { useState, useMemo } from "react";
import { FiCheck } from "react-icons/fi";
import { ContenedorPaso, Button } from "../../../ui";
import styles from "./Paso2RevisionCheques.module.css";

const ChequeItemCard = ({ cheque, isSelected, onToggle }) => {
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

export const Paso2RevisionCheques = ({
  chequesProcesados = [],
  chequesYaAprobados = [],
  onContinuar,
  onDesistir,
}) => {
  const [selectedIds, setSelectedIds] = useState(() => {
    if (chequesYaAprobados.length > 0) {
      return chequesYaAprobados.map((c) => c.id);
    }
    return chequesProcesados.map((c) => c.id);
  });

  const handleToggleCheque = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleAvanzar = () => {
    const chequesSeleccionados = chequesProcesados.filter((c) =>
      selectedIds.includes(c.id),
    );
    onContinuar(chequesSeleccionados);
  };

  const totalSumatoria = useMemo(() => {
    const total = chequesProcesados
      .filter((c) => selectedIds.includes(c.id))
      .reduce((acc, curr) => acc + curr.montoNumerico, 0);

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(total);
  }, [chequesProcesados, selectedIds]);

  const cantidadSeleccionada = selectedIds.length;

  return (
    <ContenedorPaso
      title="Confirmas los cheques"
      subtitle="Carga masiva de cheques"
    >
      <p className={styles.introText}>
        Estos son los cheques que tenías cargados en el archivo. Ya los
        procesamos y simulamos una oferta para vos. Hace click en cada ítem para
        más detalles y selecciona aquellas ofertas con las que estas conforme de
        avanzar. Si ves alguna solicitud con error,{" "}
        <strong>
          podes desistir, corregir la información y volver a cargar el archivo.
        </strong>
      </p>

      <div className={styles.listContainer}>
        {chequesProcesados.map((cheque) => (
          <ChequeItemCard
            key={cheque.id}
            cheque={cheque}
            isSelected={selectedIds.includes(cheque.id)}
            onToggle={handleToggleCheque}
          />
        ))}
      </div>

      <div className={styles.summaryContainer}>
        <div className={styles.summaryBox}>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>
              Total estimado a recibir
            </span>
            <span className={styles.summaryAmount}>{totalSumatoria}</span>
            <span className={styles.summaryCount}>
              {cantidadSeleccionada}{" "}
              {cantidadSeleccionada === 1
                ? "cheque seleccionado"
                : "cheques seleccionados"}
            </span>
          </div>

          <div className={styles.summaryActions}>
            <button
              type="button"
              className={styles.btnDesistir}
              onClick={onDesistir}
            >
              DESISTO DE AVANZAR
            </button>
            <Button
              variant="primary"
              className={styles.btnContinuar}
              onClick={handleAvanzar}
              disabled={cantidadSeleccionada === 0}
            >
              CONTINUAR
            </Button>
          </div>
        </div>
      </div>
    </ContenedorPaso>
  );
};

import React, { useState, useMemo } from "react";
import { ContenedorPaso, Button, SkeletonList } from "../../../../ui";
import { ChequeItemCard } from "../components/ChequeItemCard/ChequeItemCard";
import styles from "./Paso2RevisionCheques.module.css";

export const Paso2RevisionCheques = ({
  chequesProcesados = [],
  chequesYaAprobados = [],
  isLoading = false,
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
        {isLoading ? (
          <SkeletonList count={3} rows={3} showHeader={false} />
        ) : (
          chequesProcesados.map((cheque) => (
            <ChequeItemCard
              key={cheque.id}
              cheque={cheque}
              isSelected={selectedIds.includes(cheque.id)}
              onToggle={handleToggleCheque}
            />
          ))
        )}
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

import React from "react";
import { Button, Alert } from "../../ui";
import styles from "./TicketSimulacion.module.css";

const EMPTY_ARRAY = [];

export const TicketSimulacion = ({
  netoRecibir,
  filasCostos = EMPTY_ARRAY,
  totalCostos,
  datoExtraTotal,
  datosResumen = EMPTY_ARRAY,
  textoAlerta,
  onContinuar,
  onRecalcular,
  textoBotonPrimario = "Continuar",
  textoBotonSecundario = "Recalcular",
}) => {
  return (
    <div className={styles.resultsBox}>
      {/* HEADER: NETO A RECIBIR */}
      <div className={styles.resultsHeader}>
        <h3 className={styles.resultsTitle}>Neto estimado a recibir:</h3>
        <p className={styles.resultsAmount}>{netoRecibir}</p>
      </div>

      {/* BODY: DESGLOSE DE COSTOS */}
      <div className={styles.resultsBody}>
        {filasCostos.map((fila, index) => (
          <div key={index} className={styles.resultRow}>
            <span>{fila.label}</span>
            <span>{fila.value}</span>
          </div>
        ))}

        <div className={`${styles.resultRow} ${styles.resultTotalRow}`}>
          <span className={styles.textYellow}>Total de costos</span>
          <span className={styles.textYellow}>{totalCostos}</span>
        </div>

        {datoExtraTotal && (
          <div className={`${styles.resultRow} ${styles.mtSmall}`}>
            <span className={styles.textMuted}>{datoExtraTotal.label}</span>
            <span className={styles.textMuted}>{datoExtraTotal.value}</span>
          </div>
        )}
      </div>

      {/* CAJA DE RESUMEN */}
      {datosResumen.length > 0 && (
        <div className={styles.summaryBox}>
          {datosResumen.map((dato, index) => (
            <div key={index} className={styles.summaryRow}>
              <span>{dato.label}</span>
              <strong>{dato.value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* ALERTA INFORMATIVA */}
      {textoAlerta && (
        <div className={styles.alertWrapper}>
          <Alert variant="default" layout="box">
            {textoAlerta}
          </Alert>
        </div>
      )}

      {/* ACCIONES */}
      <div className={styles.actionsFlex}>
        <Button
          variant="primary"
          onClick={onContinuar}
        >
          {textoBotonPrimario}
        </Button>
        <Button variant="link" onClick={onRecalcular}>
          {textoBotonSecundario}
        </Button>
      </div>
    </div>
  );
};

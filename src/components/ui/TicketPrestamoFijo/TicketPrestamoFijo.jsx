import React from "react";
import { Button } from "../Button/Button";
import styles from "./TicketPrestamoFijo.module.css";

export const TicketPrestamoFijo = ({
  datosTabla = [],
  textoAlerta = 'Haciendo click en el botón de "Continuar" le informaremos si obtiene una pre-aprobación de la línea para poder seguir avanzando con su solicitud.',
  onContinuar,
  onRecalcular,
  textoBotonPrimario = "Continuar",
  textoBotonSecundario = "Desisto de avanzar",
}) => {
  return (
    <div className={styles.ticketContainer}>
      <div className={styles.ticketBox}>
        <div className={styles.ticketHeader}>
          <h3 className={styles.ticketTitle}>Características del préstamo</h3>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.infoTable}>
            <tbody>
              {datosTabla.map((fila, index) => (
                <tr key={fila.id || fila.conceptos?.[0]?.label || "fila-" + index}>
                  <td className={styles.tdLabelPlazo}>
                    {index === 0 && (
                      <span className={styles.columnHeader}>Plazos</span>
                    )}
                    <div className={styles.cellContent}>{fila.plazo}</div>
                  </td>

                  <td className={styles.tdDataGroups}>
                    {fila.conceptos.map((concepto) => (
                      <div className={styles.dataRow} key={concepto.label}>
                        <span className={styles.dataLabel}>
                          {concepto.label}
                        </span>
                        <span className={styles.dataValue}>
                          {concepto.value}
                          {concepto.unidad && (
                            <span className={styles.dataUnidad}>
                              {concepto.unidad}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.actionsFlex}>
          <Button variant="primary" onClick={onContinuar}>
            {textoBotonPrimario}
          </Button>
          <Button variant="link" onClick={onRecalcular}>
            {textoBotonSecundario}
          </Button>
        </div>
      </div>

      {textoAlerta && <p className={styles.textoAlerta}>{textoAlerta}</p>}
    </div>
  );
};

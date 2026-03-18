import React from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { Button } from "../../../ui";
import styles from "./SocioTaskCard.module.css";

export const SocioTaskCard = ({
  socio,
  index,
  isCompleto,
  intentoAvanzar,
  onEdit,
}) => {
  const getEstadoClass = () => {
    if (isCompleto) return styles.statusCheck;
    if (intentoAvanzar) return styles.statusError;
    return styles.statusWarn;
  };

  return (
    <div
      className={`${styles.card} ${isCompleto ? styles.cardSuccess : intentoAvanzar ? styles.cardError : ""}`}
      onClick={() => onEdit(index)}
    >
      <div className={styles.infoGroup}>
        <div className={`${styles.iconPill} ${getEstadoClass()}`}>
          {isCompleto ? <FiCheckCircle /> : <FiAlertCircle />}
        </div>

        <div className={styles.textGroup}>
          <h4 className={styles.nombre}>{socio.nombre}</h4>
          <p className={styles.detalles}>
            CUIT: {socio.cuit} • Participación:{" "}
            <strong>{socio.participacion}%</strong>
          </p>
        </div>
      </div>

      <Button
        variant={isCompleto ? "outline" : "primary"}
        size="sm"
        className={styles.actionBtn}
      >
        {isCompleto ? "MODIFICAR" : "COMPLETAR DATOS"}
      </Button>
    </div>
  );
};

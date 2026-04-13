import React from "react";
import { FiCheckCircle, FiAlertCircle, FiEdit2 } from "react-icons/fi";
import { Button } from "../../../../ui";
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(index);
        }
      }}
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

      {isCompleto ? (
        <Button
          variant="ghost"
          size="sm"
          className={styles.taskBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(index);
          }}
        >
          <FiEdit2 size={12} /> MODIFICAR
        </Button>
      ) : (
        <Button variant="outline" size="sm" className={styles.taskBtn}>
          COMPLETAR DATOS
        </Button>
      )}
    </div>
  );
};

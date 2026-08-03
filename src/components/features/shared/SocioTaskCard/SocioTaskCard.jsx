import React from "react";
import { FiCheckCircle, FiAlertCircle, FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "./SocioTaskCard.module.css";

export const SocioTaskCard = ({ socio, index, isCompleto, intentoAvanzar, onEdit, onDelete }) => {
  const dotClass = isCompleto
    ? styles.dotGreen
    : intentoAvanzar
    ? styles.dotRed
    : styles.dotYellow;

  const badgeClass = isCompleto
    ? styles.badgeDone
    : intentoAvanzar
    ? styles.badgeError
    : styles.badgeWarn;

  const rowClass = isCompleto
    ? styles.rowSuccess
    : intentoAvanzar
    ? styles.rowError
    : "";

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
      className={`${styles.row} ${rowClass}`}
      onClick={() => onEdit(index)}
    >
      <span className={`${styles.dot} ${dotClass}`} />

      <div className={styles.info}>
        <strong className={styles.nombre}>{socio.nombre}</strong>
        <span className={styles.sub}>CUIT {socio.cuit}</span>
      </div>

      <span className={styles.participacion}>{socio.participacion}%</span>

      <span className={`${styles.badge} ${badgeClass}`}>
        {isCompleto ? "Completo" : "Pendiente"}
      </span>

      <button
        type="button"
        className={styles.editBtn}
        onClick={(e) => { e.stopPropagation(); onEdit(index); }}
        title="Editar"
      >
        <FiEdit2 size={13} />
      </button>

      {onDelete && (
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(index); }}
          title="Eliminar"
        >
          <FiTrash2 size={13} />
        </button>
      )}
    </div>
  );
};
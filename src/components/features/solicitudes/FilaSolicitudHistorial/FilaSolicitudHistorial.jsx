import React from "react";
import { FiChevronRight, FiCheck, FiX, FiSlash } from "react-icons/fi";
import styles from "./FilaSolicitudHistorial.module.css";

const tonoDesde = (estado) => {
  const e = String(estado || "").toLowerCase();
  if (e.includes("aprob")) return { tono: "aprobada", Icono: FiCheck };
  if (e.includes("rechaz")) return { tono: "rechazada", Icono: FiX };
  return { tono: "cancelada", Icono: FiSlash };
};

export const FilaSolicitudHistorial = ({ solicitud, onVerDetalle }) => {
  const { tono, Icono } = tonoDesde(solicitud.estado);
  const verDetalle = () => onVerDetalle?.(solicitud);

  return (
    <button
      type="button"
      className={`${styles.fila} ${styles[`tono_${tono}`]}`}
      onClick={verDetalle}
      aria-label={`Ver detalle de la solicitud N° ${solicitud.id}`}
    >
      <span className={styles.punto} aria-hidden="true" />

      <span className={styles.info}>
        <span className={styles.tipo}>
          {solicitud.tipo || "Operación"}
          {solicitud.lineaNombre && solicitud.lineaNombre !== solicitud.tipo && (
            <span className={styles.linea}> · {solicitud.lineaNombre}</span>
          )}
        </span>
        <span className={styles.meta}>
          N° {solicitud.id} · {solicitud.fecha || "-"}
        </span>
      </span>

      <span className={styles.lado}>
        <span className={styles.monto}>
          <span className={styles.moneda}>{solicitud.moneda || "$"}</span> {solicitud.monto}
        </span>
        <span className={styles.pill}>
          <Icono aria-hidden="true" />
          {solicitud.estado}
        </span>
      </span>

      <FiChevronRight className={styles.chevron} aria-hidden="true" />
    </button>
  );
};

export default FilaSolicitudHistorial;

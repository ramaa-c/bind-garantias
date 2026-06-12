import React from "react";
import { FiCalendar, FiChevronRight } from "react-icons/fi";
import styles from "./TarjetaSolicitud.module.css";

export const TarjetaSolicitud = ({ solicitud, onVerDetalle }) => {
  const getStatusKey = (estado) => {
    const e = estado?.toLowerCase();
    if (e?.includes("aprob")) return "statusApproved";
    if (e?.includes("rechaz")) return "statusRejected";
    if (e?.includes("cancel")) return "statusCancelled";
    return "statusWaiting";
  };

  const statusKey = getStatusKey(solicitud.estado);

  return (
    <div className={`${styles.solicitudCard} ${styles[statusKey]}`}>
      <div className={styles.cardMain}>
        <div className={styles.leftInfo}>
          <div className={`${styles.statusBadge} ${styles[statusKey]}`}>
            <span className={styles.statusDot}></span>
            {solicitud.estado || "Pendiente"}
          </div>

          <h3 className={styles.solicitudTitle}>
            Solicitud N° {solicitud.id} • <span className={styles.tipo}>{solicitud.tipo || "Operación"}</span>
          </h3>

          <div className={styles.montoRow}>
            <span className={styles.montoLabel}>Monto:</span>
            <span className={styles.montoValue}>{solicitud.moneda || "$"} {solicitud.monto}</span>
          </div>
        </div>

        <div className={styles.rightInfo}>
          <div className={styles.dateBlock}>
            <FiCalendar className={styles.calendarIcon} />
            <span>{solicitud.fecha || "-"}</span>
          </div>

          <div className={styles.actionsWrapper}>
            {solicitud.acciones?.map((accion) => (
              <button type="button" key={accion} className={styles.btnAction}>
                {accion}
              </button>
            )) || (
                <button type="button" className={styles.btnDetalle} onClick={() => onVerDetalle && onVerDetalle(solicitud)}>
                  VER DETALLE <FiChevronRight />
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
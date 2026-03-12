import React from "react";
import { FiCalendar } from "react-icons/fi";
import styles from "./TarjetaSolicitud.module.css";

export const TarjetaSolicitud = ({ solicitud }) => {
  const getStatusClass = (estado) => {
    switch (estado) {
      case "esperando":
        return styles.statusWaiting;
      case "rechazado":
        return styles.statusRejected;
      case "aprobado":
        return styles.statusApproved;
      default:
        return "";
    }
  };

  return (
    <div className={`${styles.solicitudCard} ${getStatusClass(solicitud.estado)}`}>
      <div className={styles.solicitudCardHeader}>
        <div className={`${styles.solicitudStatusBadge} ${getStatusClass(solicitud.estado)}`}>
          <span className={styles.statusDot}></span>
          {solicitud.estadoTexto}
        </div>
        <div className={styles.solicitudDate}>
          <FiCalendar /> {solicitud.fechaAlta}
        </div>
      </div>

      <div className={styles.solicitudCardBody}>
        <div className={styles.solicitudInfo}>
          <h3 className={styles.solicitudMainText}>
            Solicitud N° {solicitud.id} por U$D {solicitud.monto}
          </h3>
          {solicitud.vencimiento && (
            <p className={styles.solicitudSubText}>
              Fecha de vencimiento: {solicitud.vencimiento}
            </p>
          )}
        </div>

        <div className={styles.solicitudActions}>
          {solicitud.acciones.map((accion, i) => (
            <button
              key={i}
              className={`${styles.btnLink} ${
                accion === "CONTINUAR" ? styles.actionPrimary : styles.actionSecondary
              }`}
              onClick={() => console.log(`Acción: ${accion} en Solicitud ${solicitud.id}`)}
            >
              {accion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
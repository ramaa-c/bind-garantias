import React from "react";
import { FiCalendar, FiChevronRight, FiCheckCircle, FiClock, FiXCircle, FiSlash } from "react-icons/fi";
import styles from "./TarjetaSolicitud.module.css";

const ESTADOS = {
  statusApproved: { icon: FiCheckCircle, label: "Aprobada" },
  statusRejected: { icon: FiXCircle, label: "Rechazada" },
  statusCancelled: { icon: FiSlash, label: "Cancelada" },
  statusWaiting: { icon: FiClock, label: "Pendiente" },
};

const getStatusKey = (estado) => {
  const e = estado?.toLowerCase();
  if (e?.includes("aprob")) return "statusApproved";
  if (e?.includes("rechaz")) return "statusRejected";
  if (e?.includes("cancel")) return "statusCancelled";
  return "statusWaiting";
};

export const TarjetaSolicitud = ({ solicitud, onVerDetalle, acciones }) => {
  const statusKey = getStatusKey(solicitud.estado);
  const StatusIcon = ESTADOS[statusKey].icon;

  // Hoy "acciones" solo trae "Cancelar" (variant danger). Va en la misma
  // barra de pie que "Ver detalle" pero en la punta opuesta — misma altura,
  // máxima distancia posible entre ambas dentro de la tarjeta, y con label
  // explícito (nada de ícono solo): que cancelar una solicitud no se pueda
  // confundir con una "x" de cerrar.
  const accionDestructiva = acciones?.find((a) => a.variant === "danger");
  const otrasAcciones = acciones?.filter((a) => a.variant !== "danger");

  return (
    <div className={`${styles.card} ${styles[statusKey]}`}>
      <div className={styles.topRow}>
        <span className={styles.statusPill}>
          <StatusIcon size={11} />
          {solicitud.estado || "Pendiente"}
        </span>
        <span className={styles.eyebrow}>Solicitud N° {solicitud.id}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.info}>
          <h3 className={styles.tipo}>{solicitud.tipo || "Operación"}</h3>
          <div className={styles.dateBlock}>
            <FiCalendar size={12} />
            <span>{solicitud.fecha || "-"}</span>
          </div>
        </div>

        <div className={styles.montoBlock}>
          <span className={styles.montoMoneda}>{solicitud.moneda || "$"}</span>
          <span className={styles.montoValue}>{solicitud.monto}</span>
        </div>
      </div>

      <div className={styles.footer}>
        {accionDestructiva && (
          <button type="button" className={styles.btnCancel} onClick={accionDestructiva.onClick}>
            {accionDestructiva.label}
          </button>
        )}
        <div className={styles.footerRight}>
          {otrasAcciones?.map((accion) => (
            <button type="button" key={accion.label} className={styles.btnAction} onClick={accion.onClick}>
              {accion.label}
            </button>
          ))}
          <button type="button" className={styles.btnDetalle} onClick={() => onVerDetalle && onVerDetalle(solicitud)}>
            Ver detalle <FiChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

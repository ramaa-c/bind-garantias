import React from "react";
import { FiChevronRight, FiCheckCircle, FiClock, FiXCircle, FiSlash } from "react-icons/fi";
import { EstadoSolicitudPasos } from "../EstadoSolicitudPasos/EstadoSolicitudPasos";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
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
  if (e?.includes("cancel") || e?.includes("venc")) return "statusCancelled";
  return "statusWaiting";
};

export const TarjetaSolicitudSkeleton = () => (
  <div className={`${styles.card} ${styles.cardCargando}`} aria-hidden="true">
    <Skeleton className={styles.icono} radius="0.8rem" />
    <div className={styles.info}>
      <div className={styles.tituloFila}>
        <Skeleton width="7rem" height="1rem" />
        <Skeleton width="5.5rem" height="1.3rem" radius="pill" />
      </div>
      <Skeleton width="11rem" height="0.75rem" />
    </div>
    <div className={styles.montoBlock}>
      <Skeleton width="6.5rem" height="0.65rem" />
      <Skeleton width="8rem" height="1.25rem" />
    </div>
    <div className={styles.recorrido}>
      <Skeleton width="100%" height="2.25rem" radius="0.6rem" />
    </div>
    <div className={styles.acciones}>
      <Skeleton width="6.5rem" height="2.25rem" radius="pill" />
    </div>
  </div>
);

export const TarjetaSolicitud = ({ solicitud, onVerDetalle, acciones }) => {
  const statusKey = getStatusKey(solicitud.estado);
  const StatusIcon = ESTADOS[statusKey].icon;

  const verDetalle = () => onVerDetalle && onVerDetalle(solicitud);
  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      verDetalle();
    }
  };
  // Las acciones propias (Cancelar) no deben abrir además el detalle.
  const sinPropagar = (onClick) => (e) => {
    e.stopPropagation();
    onClick?.(e);
  };

  // Hoy "acciones" solo trae "Cancelar" (variant danger): va con label
  // explícito (nada de ícono solo) para que cancelar una solicitud no se
  // confunda con una "x" de cerrar.
  const accionDestructiva = acciones?.find((a) => a.variant === "danger");
  const otrasAcciones = acciones?.filter((a) => a.variant !== "danger");

  return (
    <article
      className={`${styles.card} ${styles[statusKey]}`}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle de la solicitud N° ${solicitud.id}`}
      onClick={verDetalle}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.icono} aria-hidden="true">
        <StatusIcon />
      </span>

      <div className={styles.info}>
        <div className={styles.tituloFila}>
          <h3 className={styles.tipo}>{solicitud.tipo || "Operación"}</h3>
          <span className={styles.statusPill}>
            <StatusIcon size={11} />
            {solicitud.estado || "Pendiente"}
          </span>
        </div>
        {solicitud.lineaNombre && solicitud.lineaNombre !== solicitud.tipo && (
          <span className={styles.linea}>{solicitud.lineaNombre}</span>
        )}
        <span className={styles.meta}>
          Solicitud N° {solicitud.id} · {solicitud.fecha || "-"}
        </span>
      </div>

      <div className={styles.montoBlock}>
        <span className={styles.montoLabel}>Monto solicitado</span>
        <span className={styles.montoFila}>
          <span className={styles.montoMoneda}>{solicitud.moneda || "$"}</span>
          <span className={styles.montoValue}>{solicitud.monto}</span>
        </span>
      </div>

      <div className={styles.recorrido}>
        <EstadoSolicitudPasos estado={solicitud.estado} fecha={solicitud.fecha} />
      </div>

      <div className={styles.acciones}>
        {accionDestructiva && (
          <button type="button" className={styles.btnCancel} onClick={sinPropagar(accionDestructiva.onClick)}>
            {accionDestructiva.label}
          </button>
        )}
        {otrasAcciones?.map((accion) => (
          <button type="button" key={accion.label} className={styles.btnAction} onClick={sinPropagar(accion.onClick)}>
            {accion.label}
          </button>
        ))}
        <span className={styles.btnDetalle} aria-hidden="true">
          Ver detalle <FiChevronRight size={13} />
        </span>
      </div>

      <FiChevronRight className={styles.chevron} aria-hidden="true" />
    </article>
  );
};

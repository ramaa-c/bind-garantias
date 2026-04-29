import React from "react";
import { FiMapPin, FiMail, FiPhone, FiX } from "react-icons/fi";
import { Modal, Button } from "../../../ui";
import styles from "./ModalDetalleSolicitud.module.css";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const estadoConfig = {
  Cancelada: { color: styles.badgeRed, label: "Cancelada" },
  Aprobada: { color: styles.badgeGreen, label: "Aprobada" },
  Pendiente: { color: styles.badgeYellow, label: "Pendiente" },
};

export const ModalDetalleSolicitud = ({ isOpen, onClose, solicitud }) => {
  if (!solicitud) return null;

  const estado = estadoConfig[solicitud.estado] || {
    color: styles.badgeYellow,
    label: solicitud.estado,
  };
  const esCancelada = solicitud.estado === "Cancelada";
  const tipoLabel =
    solicitud.tipo === "Cheque"
      ? "Cheque Propio"
      : solicitud.tipo || "Operación";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="620px">
      <div className={styles.container}>
        {/* ── HEADER IDENTITARIO ──────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.heroMeta}>
              <span className={styles.heroBadge}>Solicitud</span>
              <span className={styles.heroId}>ID · OB-20436209011</span>
            </div>
            <span className={`${styles.estadoBadge} ${estado.color}`}>
              {estado.label}
            </span>
          </div>

          <h2 className={styles.heroName}>CAMIMPORT S.R.L.</h2>
          <p className={styles.heroCuit}>CUIT 30-64086932-8</p>

          {/* MÉTRICAS */}
          <div className={styles.metricsRow}>
            <div className={styles.metricChip}>
              <span className={styles.metricLabel}>Producto</span>
              <span className={styles.metricValue}>{tipoLabel}</span>
            </div>
            <div className={styles.metricChip}>
              <span className={styles.metricLabel}>Monto</span>
              <span className={`${styles.metricValue} ${styles.metricMonto}`}>
                {solicitud.moneda || "$"} {solicitud.monto}
              </span>
            </div>
            <div className={styles.metricChip}>
              <span className={styles.metricLabel}>Fecha</span>
              <span className={styles.metricValue}>
                {solicitud.fecha || "28/04/2026"}
              </span>
            </div>
          </div>

          {/* ALERTA CANCELADA */}
          {esCancelada && (
            <div className={styles.alertBox}>
              <span className={styles.alertTitle}>Motivos de rechazo</span>
              <ul className={styles.alertList}>
                <li>
                  Parte de la composición accionaria no cumple el rango de edad
                  permitido
                </li>
                <li>
                  Parte de la composición accionaria no cumple el rango de edad
                  permitido
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* ── CONTACTO ────────────────────────────────────────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Contacto</p>
          <div className={styles.contactList}>
            {[
              { icon: <FiMail size={13} />, text: "30640869328@yopmail.com" },
              { icon: <FiPhone size={13} />, text: "1111111111" },
              {
                icon: <FiMapPin size={13} />,
                text: "24 de Septiembre 2447, Rosario, Santa Fe",
              },
            ].map(({ icon, text }, i) => (
              <div key={i} className={styles.contactRow}>
                <span className={styles.contactIcon}>{icon}</span>
                <span className={styles.contactText}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ESTADO FIRMA ────────────────────────────────────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Estado de la firma</p>
          <div className={styles.firmaRow}>
            <span className={styles.firmaIndicator} />
            <span className={styles.firmaText}>Sin firmar</span>
          </div>
        </div>

        {/* ── FIADORES ────────────────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <p className={styles.sectionLabel}>Fiadores</p>
            <span className={styles.countBadge}>2 personas</span>
          </div>
          <div className={styles.fiadoresGrid}>
            {["OMAR ALBERTO DELMIRO CAMPAGNOLO", "LOPEZ PATRICIA MONICA"].map(
              (nombre, i) => (
                <div key={i} className={styles.fiadorCard}>
                  <div className={styles.fiadorAvatar}>
                    {getInitials(nombre)}
                  </div>
                  <div className={styles.fiadorInfo}>
                    <p className={styles.fiadorName}>{nombre}</p>
                    <p className={styles.fiadorFirma}>Sin firmar</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* ── ACCIONES ────────────────────────────────────────────────────── */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Cerrar
          </button>
          <Button variant="primary" className={styles.btnPrimary}>
            Ver contrato
          </Button>
        </div>
      </div>
    </Modal>
  );
};

import React from "react";
import { FiMapPin, FiMail, FiPhone, FiCalendar, FiDollarSign, FiCheckSquare } from "react-icons/fi";
import { FaUserFriends } from "react-icons/fa";
import { Modal, Button } from "../../../ui";
import styles from "./ModalDetalleSolicitud.module.css";

export const ModalDetalleSolicitud = ({ isOpen, onClose, solicitud }) => {
  if (!solicitud) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de solicitud"
      maxWidth="700px"
    >
      <div className={styles.container}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Datos de contacto</h4>
          <ul className={styles.listInfo}>
            <li>
              <strong>@</strong> CAMIMPORT S R L
            </li>
            <li>
              <FiMail className={styles.icon} /> 30640869328@yopmail.com
            </li>
            <li>
              <FiPhone className={styles.icon} /> 1111111111
            </li>
            <li>
              <FiMapPin className={styles.icon} /> 24 DE SEPTIEMBRE 2447 , ROSARIO , SANTA FE
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Datos de la solicitud</h4>
          <ul className={styles.listInfo}>
            <li>
              <FiCheckSquare className={styles.icon} /> Producto seleccionado: {solicitud.tipo === "Cheque" ? "Cheque Propio" : solicitud.tipo || "Operación"}
            </li>
            <li>
              <FiDollarSign className={styles.icon} /> Monto: {solicitud.moneda || "$"} {solicitud.monto}
            </li>
            <li>
              <FiCalendar className={styles.icon} /> Fecha de solicitud: {solicitud.fecha || "28/04/2026"} 13:57
            </li>
            <li>
              <span className={styles.icon}>✿</span> Estado: <span className={solicitud.estado === "Cancelada" ? styles.statusCancelado : styles.statusBold}>{solicitud.estado}</span> 
              {solicitud.estado === "Cancelada" && " (No cumple con nuestros criterios de aceptación)"}
            </li>
            <li>
              <em>Estado de la firma:</em> Sin firmar
            </li>
          </ul>

          {solicitud.estado === "Cancelada" && (
            <ul className={styles.bulletList}>
              <li>Parte de tu composición accionaria no cumple el rango de edad permitido</li>
              <li>Parte de tu composición accionaria no cumple el rango de edad permitido</li>
            </ul>
          )}
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <FaUserFriends className={styles.icon} /> Fiadores:
          </h4>
          <div className={styles.fiadoresGrid}>
            <div className={styles.fiadorCard}>
              <p className={styles.fiadorName}>OMAR ALBERTO DELMIRO CAMPAGNOLO</p>
              <p className={styles.fiadorFirma}><em>Estado de la firma:</em> Sin firmar</p>
            </div>
            <div className={styles.fiadorCard}>
              <p className={styles.fiadorName}>LOPEZ PATRICIA MONICA</p>
              <p className={styles.fiadorFirma}><em>Estado de la firma:</em> Sin firmar</p>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiCreditCard,
  FiBriefcase,
  FiSettings,
  FiMenu,
} from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`${styles.container} ${isOpen ? styles.open : ""}`}>
      {/* --- HEADER MÓVIL --- */}
      <div className={styles.mobileHeader}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <FiMenu size={24} color="var(--white)" />
        </button>
        <img src={logoBind} alt="Logo BIND" className={styles.mobileLogo} />
      </div>

      <nav>
        <p className={styles.heading}>GENERAL</p>
        <button
          className={`${styles.link} ${isActive("/inicio") ? styles.active : ""}`}
          onClick={() => {
            navigate("/inicio");
            onClose();
          }}
        >
          <FiHome className={styles.icon} /> Inicio
        </button>

        <p className={`${styles.heading} ${styles.headingSpacing}`}>
          GESTIONES
        </p>
        <button
          className={`${styles.link} ${isActive("/pagare") ? styles.active : ""}`}
          onClick={() => {
            navigate("/pagare");
            onClose();
          }}
        >
          <FiFileText className={styles.icon} /> Pagaré USD
        </button>
        <button
          className={`${styles.link} ${isActive("/cheques") ? styles.active : ""}`}
          onClick={() => {
            navigate("/cheques");
            onClose();
          }}
        >
          <FiCreditCard className={styles.icon} /> Alta de Cheques
        </button>
        <button
          className={`${styles.link} ${isActive("/solicitud-cheques") ? styles.active : ""}`}
          onClick={() => {
            navigate("/solicitud-cheques");
            onClose();
          }}
        >
          <FiCreditCard className={styles.icon} /> Operar Cheques
        </button>
        <button
          className={`${styles.link} ${isActive("/carga-masiva-cheques") ? styles.active : ""}`}
          onClick={() => {
            navigate("/carga-masiva-cheques");
            onClose();
          }}
        >
          <FiCreditCard className={styles.icon} /> Carga Masiva Cheques
        </button>
        <button
          className={`${styles.link} ${isActive("/prestamos") ? styles.active : ""}`}
          onClick={() => {
            navigate("/prestamos");
            onClose();
          }}
        >
          <FiBriefcase className={styles.icon} /> Préstamos
        </button>
      </nav>

      <div className={styles.footer}>
        <button className={styles.link}>
          <FiSettings className={styles.icon} /> Configuración
        </button>
      </div>
    </aside>
  );
}

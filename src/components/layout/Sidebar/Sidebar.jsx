import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiBriefcase,
  FiDollarSign,
  FiSettings,
  FiMenu,
  FiLayers,
  FiEdit,
  FiUsers,
} from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

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

      <nav className={styles.navMenu}>
        {/* ─── SECCIÓN: GENERAL ─── */}
        <p className={styles.heading}>GENERAL</p>
        <button
          className={`${styles.link} ${isActive("/inicio") ? styles.active : ""}`}
          onClick={() => handleNavigate("/inicio")}
        >
          <FiHome className={styles.icon} /> Inicio
        </button>

        {/* ─── SECCIÓN: MIS LÍNEAS ─── */}
        <p className={`${styles.heading} ${styles.headingSpacing}`}>
          MIS LÍNEAS
        </p>
        <button
          className={`${styles.link} ${isActive("/pagare") ? styles.active : ""}`}
          onClick={() => handleNavigate("/pagare")}
        >
          <FiFileText className={styles.icon} /> Línea de Pagaré USD
        </button>
        <button
          className={`${styles.link} ${isActive("/cheques") ? styles.active : ""}`}
          onClick={() => handleNavigate("/cheques")}
        >
          <FiBriefcase className={styles.icon} /> Línea de Cheques
        </button>
        <button
          className={`${styles.link} ${isActive("/prestamos") ? styles.active : ""}`}
          onClick={() => handleNavigate("/prestamos")}
        >
          <FiDollarSign className={styles.icon} /> Línea de Préstamos
        </button>

        {/* ─── SECCIÓN: TERCEROS ─── */}
        <p className={`${styles.heading} ${styles.headingSpacing}`}>TERCEROS</p>
        <button
          className={`${styles.link} ${isActive("/solicitud-cheques") ? styles.active : ""}`}
          onClick={() => handleNavigate("/solicitud-cheques")}
        >
          <FiEdit className={styles.icon} /> Operar Cheques
        </button>
        <button
          className={`${styles.link} ${isActive("/carga-masiva-cheques") ? styles.active : ""}`}
          onClick={() => handleNavigate("/carga-masiva-cheques")}
        >
          <FiLayers className={styles.icon} /> Carga Masiva Cheques
        </button>
        <button
          className={`${styles.link} ${isActive("/solicitud-pagare") ? styles.active : ""}`}
          onClick={() => handleNavigate("/solicitud-pagare")}
        >
          <FiFileText className={styles.icon} /> Operar Pagaré
        </button>
        <button
          className={`${styles.link} ${isActive("/prestamos-seleccionables") ? styles.active : ""}`}
          onClick={() => handleNavigate("/prestamos-seleccionables")}
        >
          <FiUsers className={styles.icon} /> Préstamos Seleccionables
        </button>
        <button
          className={`${styles.link} ${isActive("/prestamos-fijos") ? styles.active : ""}`}
          onClick={() => handleNavigate("/prestamos-fijos")}
        >
          <FiLayers className={styles.icon} /> Préstamos Fijos
        </button>
      </nav>

      {/* --- FOOTER DE CONFIGURACIÓN --- */}
      <div className={styles.footer}>
        <button className={styles.link}>
          <FiSettings className={styles.icon} /> Configuración
        </button>
      </div>
    </aside>
  );
}

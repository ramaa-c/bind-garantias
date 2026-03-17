import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiFileText, FiCreditCard, FiBriefcase, FiSettings } from "react-icons/fi";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={styles.container}>
      <nav>
        <p className={styles.heading}>GENERAL</p>
        <button 
          className={`${styles.link} ${isActive("/inicio") ? styles.active : ""}`} 
          onClick={() => navigate("/inicio")}
        >
          <FiHome className={styles.icon} /> Inicio
        </button>

        <p className={`${styles.heading} ${styles.headingSpacing}`}>GESTIONES</p>
        <button 
          className={`${styles.link} ${isActive("/pagare") ? styles.active : ""}`} 
          onClick={() => navigate("/pagare")}
        >
          <FiFileText className={styles.icon} /> Pagaré USD
        </button>
        <button 
          className={`${styles.link} ${isActive("/cheques") ? styles.active : ""}`} 
          onClick={() => navigate("/cheques")}
        >
          <FiCreditCard className={styles.icon} /> Cheques
        </button>
        <button 
          className={`${styles.link} ${isActive("/prestamos") ? styles.active : ""}`} 
          onClick={() => navigate("/prestamos")}
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
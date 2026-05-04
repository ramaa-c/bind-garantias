import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiBriefcase,
  FiDollarSign,
  FiMenu,
  FiLayers,
  FiEdit,
  FiUsers,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    misLineas: false,
    terceros: false,
    administracion: false,
  });

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("general")}
        >
          <p className={styles.heading}>GENERAL</p>
          <FiChevronDown
            className={`${styles.chevron} ${expandedSections.general ? styles.chevronOpen : ""}`}
          />
        </div>
        <div
          className={`${styles.collapsibleContent} ${expandedSections.general ? styles.expanded : ""}`}
        >
          <button
            className={`${styles.link} ${isActive("/solicitudes") ? styles.active : ""}`}
            onClick={() => handleNavigate("/solicitudes")}
          >
            <FiFileText className={styles.icon} /> Solicitudes
          </button>
          <button
            className={`${styles.link} ${isActive("/documentacion") ? styles.active : ""}`}
            onClick={() => handleNavigate("/documentacion")}
          >
            <FiLayers className={styles.icon} /> Documentación
          </button>
        </div>
      </nav>

      {/* --- FOOTER DE VERSIÓN --- */}
      <div className={styles.footer}>
        <p className={styles.versionText}>© 2026 Bind Garantías · v1.0.0</p>
      </div>
    </aside>
  );
}

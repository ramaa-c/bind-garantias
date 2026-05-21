import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiFileText, FiMenu, FiLayers, FiChevronDown } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { nombreEmpresa, cuitActivo } = useEmpresaActiva();

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
      <div className={styles.sidebarHeader}>
        <img src={logoBind} alt="Bind Garantías" className={styles.logo} />
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <FiMenu className={styles.closeIcon} />
        </button>
      </div>

      {nombreEmpresa && (
        <div className={styles.companyCard}>
          <div className={styles.companyAvatar}>
            {nombreEmpresa.charAt(0).toUpperCase()}
          </div>
          <div className={styles.companyInfo}>
            <p className={styles.companyName}>{nombreEmpresa}</p>
            {cuitActivo && (
              <p className={styles.companyCuit}>CUIT {cuitActivo}</p>
            )}
          </div>
        </div>
      )}

      <div className={styles.scrollArea}>
        <nav className={styles.navMenu}>
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
      </div>

      <div className={styles.footer}>
        <p className={styles.versionText}>Versión 1.0.0</p>
      </div>
    </aside>
  );
}

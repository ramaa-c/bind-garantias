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
            className={`${styles.link} ${isActive("/inicio") ? styles.active : ""}`}
            onClick={() => handleNavigate("/inicio")}
          >
            <FiHome className={styles.icon} /> Inicio
          </button>
          <button
            className={`${styles.link} ${isActive("/posicion-consolidada") ? styles.active : ""}`}
            onClick={() => handleNavigate("/posicion-consolidada")}
          >
            <FiLayers className={styles.icon} /> Posición Consolidada
          </button>
        </div>

        {/* ─── SECCIÓN: MIS LÍNEAS ─── */}
        <div
          className={`${styles.sectionHeader} ${styles.headingSpacing}`}
          onClick={() => toggleSection("misLineas")}
        >
          <p className={styles.heading}>MIS LÍNEAS</p>
          <FiChevronDown
            className={`${styles.chevron} ${expandedSections.misLineas ? styles.chevronOpen : ""}`}
          />
        </div>
        <div
          className={`${styles.collapsibleContent} ${expandedSections.misLineas ? styles.expanded : ""}`}
        >
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
        </div>

        {/* ─── SECCIÓN: TERCEROS ─── */}
        <div
          className={`${styles.sectionHeader} ${styles.headingSpacing}`}
          onClick={() => toggleSection("terceros")}
        >
          <p className={styles.heading}>TERCEROS</p>
          <FiChevronDown
            className={`${styles.chevron} ${expandedSections.terceros ? styles.chevronOpen : ""}`}
          />
        </div>
        <div
          className={`${styles.collapsibleContent} ${expandedSections.terceros ? styles.expanded : ""}`}
        >
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
        </div>

        {/* ─── SECCIÓN: ADMINISTRACIÓN ─── */}
        <div
          className={`${styles.sectionHeader} ${styles.headingSpacing}`}
          onClick={() => toggleSection("administracion")}
        >
          <p className={styles.heading}>ADMINISTRACIÓN</p>
          <FiChevronDown
            className={`${styles.chevron} ${expandedSections.administracion ? styles.chevronOpen : ""}`}
          />
        </div>
        <div
          className={`${styles.collapsibleContent} ${expandedSections.administracion ? styles.expanded : ""}`}
        >
          <button
            className={`${styles.link} ${isActive("/socios") ? styles.active : ""}`}
            onClick={() => handleNavigate("/socios")}
          >
            <FiUsers className={styles.icon} /> Directorio de Socios
          </button>
          <button
            className={`${styles.link} ${isActive("/usuarios") ? styles.active : ""}`}
            onClick={() => handleNavigate("/usuarios")}
          >
            <FiShield className={styles.icon} /> Gestión de Usuarios
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

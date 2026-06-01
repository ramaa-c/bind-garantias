import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiFileText, FiMenu, FiArchive, FiChevronDown, FiUsers, FiX, FiLogOut, FiTrendingUp, FiUser } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useAuthStore } from "../../../../store/useAuthStore";
import { TasasModal } from "../../../features/shared/TasasModal/TasasModal";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { nombreEmpresa, cuitActivo } = useEmpresaActiva();
  const isVinculado = !!nombreEmpresa;
  
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const emailUsuario = typeof user === "string" ? user : user?.email ? String(user.email) : "Usuario";

  const [isTasasModalOpen, setIsTasasModalOpen] = useState(false);

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

  const handleLogout = () => {
    clearAuth();
    navigate("/ingresar");
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
          <FiX className={styles.closeIcon} />
        </button>
      </div>

      {isVinculado && (
        <>
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
                  <FiArchive className={styles.icon} /> Documentación
                </button>
                <button
                  className={`${styles.link} ${isActive("/legajo") ? styles.active : ""}`}
                  onClick={() => handleNavigate("/legajo")}
                >
                  <FiUsers className={styles.icon} /> Legajo
                </button>
                <button
                  className={`${styles.link} ${styles.mobileOnlyLink}`}
                  onClick={() => setIsTasasModalOpen(true)}
                >
                  <FiTrendingUp className={styles.icon} /> Tasas vigentes
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      <div className={styles.footer}>
        <div className={styles.mobileOnlyFooter}>
          <div className={styles.userCard}>
            <div className={styles.userCardAvatar}>
              <FiUser />
            </div>
            <div className={styles.userCardInfo}>
              <p className={styles.userCardEmail}>{emailUsuario}</p>
              <p className={`${styles.userCardRole} ${!isVinculado ? styles.roleNoVinculado : ""}`}>
                {isVinculado ? "SOCIO ACTIVO" : "NO VINCULADO"}
              </p>
            </div>
          </div>
          <button className={styles.logoutLargeBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
        <p className={styles.versionText}>Versión 1.0.0</p>
      </div>

      <TasasModal
        isOpen={isTasasModalOpen}
        onClose={() => setIsTasasModalOpen(false)}
      />
    </aside>
  );
}

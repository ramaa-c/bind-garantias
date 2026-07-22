import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiFileText, FiMenu, FiArchive, FiChevronDown, FiChevronRight, FiUsers, FiX, FiLogOut, FiTrendingUp, FiUser } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { TasasModal } from "../../../features/shared/TasasModal/TasasModal";
import { EmpresaPerfilModal } from "../../../features/shared/EmpresaPerfilModal/EmpresaPerfilModal";
import { ConfirmacionModal } from "../../../features/shared/ConfirmacionModal/ConfirmacionModal";
import { useChannel } from "../../../../context/ChannelContext";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { nombreEmpresa, cuitActivo, onboardingCompleto } = useEmpresaActiva();
  const isVinculado = !!nombreEmpresa;
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isSolicitudesEnabled = useAuthStore((state) => state.isSolicitudesEnabled);
  const emailUsuario = typeof user === "string" ? user : user?.email ? String(user.email) : "Usuario";
  const { channelInfo } = useChannel();

  const [isTasasModalOpen, setIsTasasModalOpen] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    misLineas: false,
    terceros: false,
    administracion: false,
  });

  const { hasUnsavedChanges, setUnsavedChanges } = useNavigationStore();
  const [pendingPath, setPendingPath] = useState(null);

  const isActive = (path) => location.pathname.startsWith(`/${channelInfo.id}${path}`);

  // La companyCard también se renderiza durante Paso2 de AltaDatosEmpresa
  // (ahí "onboardingCompleto" todavía puede ser true si el teléfono ya vino
  // precargado de AFIP/Nosis antes de que el usuario confirme el Paso2): en
  // esa ruta puntual el perfil no está terminado de verdad todavía, así que
  // se fuerza a que la card se vea como siempre, sin abrir nada.
  const perfilClickeable = onboardingCompleto && !isActive("/alta-datos-empresa");

  const handleNavigate = (path) => {
    const fullPath = `/${channelInfo.id}${path.startsWith('/') ? path : '/' + path}`;
    if (hasUnsavedChanges && location.pathname !== fullPath) {
      setPendingPath(fullPath);
      return;
    }
    navigate(fullPath);
    onClose();
  };

  const confirmNavigation = () => {
    setUnsavedChanges(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
      onClose();
    }
  };

  const cancelNavigation = () => {
    setPendingPath(null);
  };

  const handleLogout = () => {
    clearAuth();
    navigate(`/${channelInfo.id}/login`);
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
        <div className={styles.logosWrapper}>
          <img src={logoBind} alt="Bind Garantías" className={styles.logo} role="button" tabIndex={0} onClick={() => isSolicitudesEnabled ? navigate(`/${channelInfo.id}/solicitudes`) : navigate(`/${channelInfo.id}/legajo`)} style={{ cursor: "pointer" }} />
          {channelInfo.id !== "default" && (
            <>
              <div className={styles.logoSeparator} />
              <img src={channelInfo.logo} alt={channelInfo.nombre} className={styles.channelLogo} />
            </>
          )}
        </div>
        <button type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <FiX className={styles.closeIcon} />
        </button>
      </div>

      {isVinculado && (
        <>
          <div
            className={`${styles.companyCard} ${perfilClickeable ? styles.companyCardClickable : ""}`}
            role={perfilClickeable ? "button" : undefined}
            tabIndex={perfilClickeable ? 0 : undefined}
            onClick={perfilClickeable ? () => setIsPerfilModalOpen(true) : undefined}
            onKeyDown={
              perfilClickeable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsPerfilModalOpen(true);
                    }
                  }
                : undefined
            }
          >
            <div className={styles.companyAvatar}>
              {nombreEmpresa.charAt(0).toUpperCase()}
            </div>
            <div className={styles.companyInfo}>
              <p className={styles.companyName}>{nombreEmpresa}</p>
              {cuitActivo && (
                <p className={styles.companyCuit}>CUIT {cuitActivo}</p>
              )}
            </div>
            {perfilClickeable && (
              <FiChevronRight className={styles.companyCardChevron} size={16} />
            )}
          </div>

          {/* Hasta que se complete el Paso 2 del alta (ver AltaDatosEmpresa)
              y se confirme el PUT, el socio ya tiene denominación pero no es
              una empresa operable todavía — no mostramos navegación a
              secciones a las que igual no puede entrar. */}
          {onboardingCompleto && (
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
                  {isSolicitudesEnabled && (
                    <button type="button"
                      className={`${styles.link} ${isActive("/solicitudes") ? styles.active : ""}`}
                      onClick={() => handleNavigate("/solicitudes")}
                    >
                      <FiFileText className={styles.icon} /> Solicitudes
                    </button>
                  )}
                  <button type="button"
                    className={`${styles.link} ${isActive("/legajo") ? styles.active : ""}`}
                    onClick={() => handleNavigate("/legajo")}
                  >
                    <FiUsers className={styles.icon} /> Legajo
                  </button>
                  <button type="button"
                    className={`${styles.link} ${isActive("/documentacion") ? styles.active : ""}`}
                    onClick={() => handleNavigate("/documentacion")}
                  >
                    <FiArchive className={styles.icon} /> Documentación
                  </button>
                  <button type="button"
                    className={`${styles.link} ${styles.mobileOnlyLink}`}
                    onClick={() => setIsTasasModalOpen(true)}
                  >
                    <FiTrendingUp className={styles.icon} /> Tasas vigentes
                  </button>
                </div>
              </nav>
            </div>
          )}
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
          <button type="button" className={styles.logoutLargeBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
        <p className={styles.versionText}>Versión 1.0.0</p>
      </div>

      <TasasModal
        isOpen={isTasasModalOpen}
        onClose={() => setIsTasasModalOpen(false)}
      />

      {/* Montado solo mientras está abierta: trae datos de validación de
          legajo (requisitos, terceros, archivos) que no hacen falta en el
          resto de las pantallas donde vive el Sidebar (ej. Solicitudes). */}
      {isPerfilModalOpen && (
        <EmpresaPerfilModal
          isOpen={isPerfilModalOpen}
          onClose={() => setIsPerfilModalOpen(false)}
        />
      )}

      <ConfirmacionModal
        isOpen={!!pendingPath}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        titulo="Cambios sin guardar"
        mensaje="Tienes archivos cargados o información que no has actualizado en el legajo. Si sales de esta pantalla se perderán. ¿Deseas descartar los cambios y salir?"
        confirmText="Descartar y salir"
        cancelText="Conservar cambios"
        maxWidth="550px"
      />
    </aside>
  );
}

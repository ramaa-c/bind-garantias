import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiFileText, FiMenu, FiArchive, FiChevronDown, FiUsers, FiX, FiLogOut, FiTrendingUp, FiUser, FiBriefcase, FiRepeat } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useVendor } from "../../../../hooks/useVendor";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { TasasModal } from "../../../features/shared/TasasModal/TasasModal";
import { ConfirmacionModal } from "../../../features/shared/ConfirmacionModal/ConfirmacionModal";
import { useChannel } from "../../../../context/ChannelContext";
import { obtenerInicialesEmpresa, obtenerVarianteAvatarEmpresa } from "../../../../utils/empresaAvatar";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { nombreEmpresa, cuitActivo, onboardingCompleto } = useEmpresaActiva();
  // En alta-datos-empresa se está dando de alta una empresa NUEVA que todavía
  // no es la "activa" del usuario (activeSocioId sigue apuntando a otra
  // empresa ya onboardeada, o a ninguna) — mostrar acá la tarjeta/nav de esa
  // otra empresa es confuso y directamente incorrecto, sin importar cuál sea.
  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const isVinculado = !!nombreEmpresa && !enAltaDatosEmpresa;

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cambiarEmpresaStore = useAuthStore((state) => state.cambiarEmpresa);
  const isSolicitudesEnabled = useAuthStore((state) => state.isSolicitudesEnabled);
  const emailUsuario = typeof user === "string" ? user : user?.email ? String(user.email) : "Usuario";
  const { channelInfo } = useChannel();
  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;

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

  // Mismo criterio que Navbar.jsx: logout "suave", solo para vendors.
  const handleCambiarEmpresa = () => {
    cambiarEmpresaStore();
    navigate(`/${channelInfo.id}/seleccionar-empresa`);
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
        <div className={styles.logosWrapper}>
          <img src={logoBind} alt="Bind Garantías" className={styles.logo} role="button" tabIndex={0} onClick={() => isSolicitudesEnabled ? navigate(`/${channelInfo.id}/solicitudes`) : navigate(`/${channelInfo.id}/legajo`)} style={{ cursor: "pointer" }} />
          {channelInfo.id !== "default" && channelInfo.logo && (
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

      {isVendor && (
        <div className={styles.vendorCard}>
          <div className={styles.vendorAvatar}>
            <FiBriefcase size={18} />
          </div>
          <div className={styles.vendorInfo}>
            <p className={styles.vendorName}>Usuario Vendor</p>
            <p className={styles.vendorMeta}>{emailUsuario}</p>
            <p className={styles.vendorMeta}>{channelInfo?.nombre || "Cadena"}</p>
          </div>
        </div>
      )}

      {isVinculado && (
        <>
          <div className={styles.companyCard}>
            <div
              className={`${styles.companyAvatar} ${styles[`avatar--${obtenerVarianteAvatarEmpresa(nombreEmpresa)}`]}`}
            >
              {obtenerInicialesEmpresa(nombreEmpresa)}
            </div>
            <div className={styles.companyInfo}>
              <div className={styles.companyNameWrap} tabIndex={0}>
                <p className={styles.companyName}>{nombreEmpresa}</p>
                <span className={styles.companyTooltip} role="tooltip">
                  {nombreEmpresa}
                </span>
              </div>
              {cuitActivo && (
                <p className={styles.companyCuit}>CUIT {cuitActivo}</p>
              )}
            </div>
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
                {isVinculado ? "SOCIO VINCULADO" : "NO VINCULADO"}
              </p>
            </div>
          </div>
          {/* Mismo criterio que Navbar.jsx: solo tiene sentido si ya hay una
              empresa activa para "cambiar" — sin eso, ya existe el botón
              "Volver a Inicio" en Paso1Cuit/BarraProgreso. */}
          {isVendor && isVinculado && (
            <button type="button" className={styles.changeCompanyBtn} onClick={handleCambiarEmpresa}>
              <FiRepeat size={14} /> Cambiar empresa
            </button>
          )}
          <button type="button" className={styles.logoutLargeBtn} onClick={handleLogout}>
            <FiLogOut size={14} /> Cerrar sesión
          </button>
        </div>
        <p className={styles.versionText}>Versión 1.0.0</p>
      </div>

      <TasasModal
        isOpen={isTasasModalOpen}
        onClose={() => setIsTasasModalOpen(false)}
      />

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

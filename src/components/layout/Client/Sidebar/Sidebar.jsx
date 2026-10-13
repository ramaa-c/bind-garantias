import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiFileText, FiMenu, FiArchive, FiChevronDown, FiUsers, FiX, FiLogOut, FiUser, FiBriefcase, FiRepeat, FiLock } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import logoBindBlack from "../../../../assets/images/bind-g-logo-black.svg";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useVendor } from "../../../../hooks/useVendor";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useThemeStore } from "../../../../store/useThemeStore";
import { useVersionApi } from "../../../../hooks/useSistema";
import { TasasModal } from "../../../features/shared/TasasModal/TasasModal";
import { PerfilModal } from "../../../features/shared/PerfilModal/PerfilModal";
import { ConfirmacionModal } from "../../../features/shared/ConfirmacionModal/ConfirmacionModal";
import { useChannel } from "../../../../context/useChannel";
import { useAccesoDashboardCliente } from "../../../../hooks/useAccesoDashboardCliente";
import { obtenerInicialesEmpresa, obtenerVarianteAvatarEmpresa } from "../../../../utils/empresaAvatar";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { nombreEmpresa, cuitActivo, onboardingCompleto, socioIdActivo } = useEmpresaActiva();
  // En alta-datos-empresa se está dando de alta una empresa NUEVA que todavía
  // no es la "activa" del usuario (activeSocioId sigue apuntando a otra
  // empresa ya onboardeada, o a ninguna) — mostrar acá la tarjeta/nav de esa
  // otra empresa es confuso y directamente incorrecto, sin importar cuál sea.
  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const isVinculado = !!nombreEmpresa && !enAltaDatosEmpresa;
  const theme = useThemeStore((state) => state.theme);
  const { data: versionApiRaw } = useVersionApi();
  // El backend devuelve un string suelto (ej. "SGRPlus API Web Version
  // 1.0"), no un objeto - se le extrae solo el número para no repetir la
  // frase completa al lado de nuestra propia versión.
  const versionApi = versionApiRaw?.match(/[\d]+(?:\.[\d]+)*\s*$/)?.[0]?.trim();

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cambiarEmpresaStore = useAuthStore((state) => state.cambiarEmpresa);
  const isSolicitudesEnabled = useAuthStore((state) => state.isSolicitudesEnabled);
  const { legajoDesbloqueado, documentacionDesbloqueada } = useAccesoDashboardCliente();
  const emailUsuario = typeof user === "string" ? user : user?.email ? String(user.email) : "Usuario";
  const { channelInfo, basePath } = useChannel();
  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;

  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    misLineas: false,
    terceros: false,
    administracion: false,
  });

  const { hasUnsavedChanges, setUnsavedChanges } = useNavigationStore();
  const [pendingPath, setPendingPath] = useState(null);

  const isActive = (path) => location.pathname.startsWith(`${basePath}${path}`);

  // Punto de atención en Legajo/Documentación cuando se acaban de
  // desbloquear (flujo "con línea activa": ver useAccesoDashboardCliente) -
  // sin esto, la única señal de que algo cambió era que el candado
  // desapareciera, algo fácil de no notar entre dos visitas. Se apaga solo
  // la primera vez que el usuario entra a esa sección (localStorage, por
  // socio - no vuelve a mostrarse en visitas futuras aunque se cierre
  // sesión o se cambie de dispositivo... salvo que ese storage se limpie,
  // caso raro y sin consecuencias graves: en el peor caso reaparece un
  // punto que ya se había visto una vez).
  const [legajoRecienDesbloqueado, setLegajoRecienDesbloqueado] = useState(false);
  const [documentacionRecienDesbloqueada, setDocumentacionRecienDesbloqueada] = useState(false);

  useEffect(() => {
    if (!socioIdActivo || !legajoDesbloqueado) return;
    const key = `bind_legajo_visto_${socioIdActivo}`;
    if (isActive("/legajo")) {
      localStorage.setItem(key, "1");
      setLegajoRecienDesbloqueado(false);
      return;
    }
    setLegajoRecienDesbloqueado(localStorage.getItem(key) !== "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioIdActivo, legajoDesbloqueado, location.pathname]);

  useEffect(() => {
    if (!socioIdActivo || !documentacionDesbloqueada) return;
    const key = `bind_documentacion_vista_${socioIdActivo}`;
    if (isActive("/documentacion")) {
      localStorage.setItem(key, "1");
      setDocumentacionRecienDesbloqueada(false);
      return;
    }
    setDocumentacionRecienDesbloqueada(localStorage.getItem(key) !== "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioIdActivo, documentacionDesbloqueada, location.pathname]);

  const handleNavigate = (path) => {
    const fullPath = `${basePath}${path.startsWith('/') ? path : '/' + path}`;
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
    navigate(`${basePath}/login`);
  };

  // Mismo criterio que Navbar.jsx: logout "suave", solo para vendors.
  const handleCambiarEmpresa = () => {
    cambiarEmpresaStore();
    navigate(`${basePath}/seleccionar-empresa`);
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
          <img src={theme === "light" ? logoBindBlack : logoBind} alt="Bind Garantías" className={styles.logo} role="button" tabIndex={0} onClick={() => isSolicitudesEnabled ? navigate(`${basePath}/solicitudes`) : navigate(`${basePath}/legajo`)} style={{ cursor: "pointer" }} />
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
                    className={`${styles.link} ${isActive("/legajo") ? styles.active : ""} ${!legajoDesbloqueado ? styles.linkBloqueado : ""}`}
                    onClick={() => legajoDesbloqueado && handleNavigate("/legajo")}
                    disabled={!legajoDesbloqueado}
                    title={
                      !legajoDesbloqueado
                        ? "Se habilita cuando tengas una solicitud en curso."
                        : legajoRecienDesbloqueado
                          ? "¡Recién se desbloqueó! Completá los datos de tu empresa."
                          : undefined
                    }
                  >
                    <FiUsers className={styles.icon} /> Legajo
                    {!legajoDesbloqueado && <FiLock className={styles.lockIcon} />}
                    {legajoRecienDesbloqueado && (
                      <span className={styles.novedadDot} aria-label="Recién desbloqueado" />
                    )}
                  </button>
                  <button type="button"
                    className={`${styles.link} ${isActive("/documentacion") ? styles.active : ""} ${!documentacionDesbloqueada ? styles.linkBloqueado : ""}`}
                    onClick={() => documentacionDesbloqueada && handleNavigate("/documentacion")}
                    disabled={!documentacionDesbloqueada}
                    title={
                      !documentacionDesbloqueada
                        ? "Se habilita cuando completes el Legajo al 100%."
                        : documentacionRecienDesbloqueada
                          ? "¡Recién se desbloqueó! Subí tu documentación."
                          : undefined
                    }
                  >
                    <FiArchive className={styles.icon} /> Documentación
                    {!documentacionDesbloqueada && <FiLock className={styles.lockIcon} />}
                    {documentacionRecienDesbloqueada && (
                      <span className={styles.novedadDot} aria-label="Recién desbloqueada" />
                    )}
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
              <p className={`${styles.userCardRole} ${!isVinculado && !isVendor ? styles.roleNoVinculado : ""}`}>
                {isVendor ? "VENDOR" : isVinculado ? "SOCIO VINCULADO" : "NO VINCULADO"}
              </p>
            </div>
          </div>
          <button type="button" className={styles.perfilBtn} onClick={() => setIsPerfilModalOpen(true)}>
            <FiUser size={14} /> Mi perfil
          </button>
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
        <p className={styles.versionText}>
          Versión {__APP_VERSION__}
          {versionApi && <> · API {versionApi}</>}
        </p>
      </div>

      <PerfilModal
        isOpen={isPerfilModalOpen}
        onClose={() => setIsPerfilModalOpen(false)}
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

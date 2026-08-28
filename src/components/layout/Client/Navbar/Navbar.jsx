import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import {
  FiMenu,
  FiChevronDown,
  FiTrendingUp,
  FiHelpCircle,
  FiRepeat,
  FiLogOut,
  FiBriefcase,
  FiUser,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import logoBindBlack from "../../../../assets/images/bind-g-logo-black.svg";
import styles from "./Navbar.module.css";
import { TasasModal } from "../../../features/shared/TasasModal/TasasModal";
import { PerfilModal } from "../../../features/shared/PerfilModal/PerfilModal";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useThemeStore } from "../../../../store/useThemeStore";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useVendor } from "../../../../hooks/useVendor";
import { useChannel } from "../../../../context/ChannelContext";

const Navbar = ({
  texto = "¿No tenés cuenta?",
  textoEnlace = "Registrate",
  rutaDestino = "/registro",
  onToggleSidebar,
  hideHelpButton = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTasasModalOpen, setIsTasasModalOpen] = useState(false);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);
  const { channelInfo } = useChannel();
  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const { nombreEmpresa, onboardingCompleto } = useEmpresaActiva();
  // Ver mismo criterio en Sidebar.jsx: en alta-datos-empresa no hay una
  // empresa "activa" real que mostrar todavía.
  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const isVinculado = !!nombreEmpresa && !enAltaDatosEmpresa;
  const onboardingCompletoEfectivo = onboardingCompleto && !enAltaDatosEmpresa;

  const emailUsuario =
    typeof user === "string"
      ? user
      : user?.email
        ? String(user.email)
        : "Usuario";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate(`/${channelInfo.id}/login`);
  };

  // Logout "suave": tira formularios/empresa activa/verificación de
  // términos de la sesión anterior (ver cambiarEmpresa en useAuthStore) pero
  // conserva user/isAuthenticated — no hace falta reingresar credenciales.
  // Solo para vendors: son los únicos con más de una empresa para elegir.
  const handleCambiarEmpresa = () => {
    setIsDropdownOpen(false);
    cambiarEmpresa();
    navigate(`/${channelInfo.id}/seleccionar-empresa`);
  };

  const handleOpenHelp = () => {
    const event = new CustomEvent("bindHelp:toggle");
    document.dispatchEvent(event);
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button type="button"
          className={styles.menuButton}
          onClick={onToggleSidebar}
          aria-label="Menú"
        >
          <FiMenu size={24} color="var(--white)" />
        </button>
        <div className={styles.logoContainer} role="button" tabIndex={0} onClick={() => navigate(`/${channelInfo.id}/solicitudes`)}>
          <img src={theme === "light" ? logoBindBlack : logoBind} alt="Bind Garantías" className={styles.logo} />
          {channelInfo.id !== "default" && channelInfo.logo && (
            <>
              <div className={styles.logoSeparator} />
              <img
                src={channelInfo.logo}
                alt={channelInfo.nombre}
                className={styles.channelLogo}
              />
            </>
          )}
        </div>

        {/* Versión de escritorio de vendorCard (ver Sidebar.jsx): en mobile
            sigue viviendo en el sidebar, tal cual. Acá va compacta - sin
            repetir el email, que ya se ve al lado en el menú de usuario -
            para no volver a parecerse a companyCard. */}
        {isVendor && (
          <div className={styles.vendorBadge}>
            <FiBriefcase size={14} className={styles.vendorBadgeIcon} />
            <span className={styles.vendorBadgeLabel}>Vendor</span>
            <span className={styles.vendorBadgeSep}>·</span>
            <span className={styles.vendorBadgeChain}>{channelInfo?.nombre || "Cadena"}</span>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        <button
          type="button"
          className={styles.themeButton}
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
        >
          {theme === "light" ? <FiMoon className={styles.themeIcon} /> : <FiSun className={styles.themeIcon} />}
        </button>

        {user ? (
          <>
            {/* Sin contenido de ayuda escrito todavía para algunas pantallas
                (ej. Seleccionar Empresa) - mejor ocultar el botón ahí que
                abrir un drawer vacío. */}
            {!hideHelpButton && (
              <button type="button"
                className={styles.helpButton}
                onClick={handleOpenHelp}
                aria-label="Abrir ayuda"
                title="Centro de Ayuda"
              >
                <FiHelpCircle className={styles.helpIcon} />
              </button>
            )}

            <div className={styles.userMenuContainer} ref={dropdownRef}>
              <div
                className={styles.userTrigger}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className={styles.avatarWrapper}>
                  <FaRegUserCircle className={styles.userIcon} />
                </div>
                <span className={styles.userName}>{emailUsuario}</span>
                <FiChevronDown
                  className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ""}`}
                />
              </div>

              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownEmail}>{emailUsuario}</p>
                    <p className={`${styles.dropdownRole} ${!isVinculado ? styles.roleNoVinculado : ""}`}>
                      {isVinculado ? "Socio vinculado" : "No vinculado"}
                    </p>
                  </div>

                  <div className={styles.dropdownBody}>
                    <button type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsPerfilModalOpen(true);
                      }}
                    >
                      <FiUser className={styles.itemIcon} /> Mi perfil
                    </button>
                    {onboardingCompletoEfectivo && (
                      <button type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsTasasModalOpen(true);
                        }}
                      >
                        <FiTrendingUp className={styles.itemIcon} /> Tasas vigentes
                      </button>
                    )}
                  </div>

                  <div className={styles.dropdownFooter}>
                    {/* Solo tiene sentido si ya hay una empresa activa para
                        "cambiar" — sin eso (vendor recién entrando, sin
                        elegir ninguna todavía) no hay nada que cambiar; para
                        ese caso ya existe el botón "Volver a Inicio" en
                        Paso1Cuit/BarraProgreso. */}
                    {isVendor && isVinculado && (
                      <button type="button" className={styles.changeCompanyBtn} onClick={handleCambiarEmpresa}>
                        <FiRepeat size={14} /> Cambiar empresa
                      </button>
                    )}
                    <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                      <FiLogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.loginContainer}>
            {texto}
            <span className={styles.link} role="button" tabIndex={0} onClick={() => navigate(`/${channelInfo.id}${rutaDestino.startsWith('/') ? rutaDestino : '/' + rutaDestino}`)}>
              {" "}
              {textoEnlace}
            </span>
          </div>
        )}
      </div>

      <TasasModal
        isOpen={isTasasModalOpen}
        onClose={() => setIsTasasModalOpen(false)}
      />

      <PerfilModal
        isOpen={isPerfilModalOpen}
        onClose={() => setIsPerfilModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;

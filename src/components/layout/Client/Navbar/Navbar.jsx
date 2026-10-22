import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiChevronDown,
  FiChevronRight,
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
import { PerfilModal } from "../../../features/shared/PerfilModal/PerfilModal";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useThemeStore, LIGHT_MODE_ENABLED } from "../../../../store/useThemeStore";
import { useSidebarStore } from "../../../../store/useSidebarStore";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useVendor } from "../../../../hooks/useVendor";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useChannel } from "../../../../context/useChannel";
import { extraerRegistroUsuario } from "../../../../utils/usuarioUtils";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";

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
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);
  const isSolicitudesEnabled = useAuthStore((state) => state.isSolicitudesEnabled);
  const { channelInfo, basePath } = useChannel();
  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const { nombreEmpresa } = useEmpresaActiva();
  // Ver mismo criterio en Sidebar.jsx: en alta-datos-empresa no hay una
  // empresa "activa" real que mostrar todavía.
  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const isVinculado = !!nombreEmpresa && !enAltaDatosEmpresa;
  // Con el sidebar compacto la empresa activa ya no se ve ahí: pasa acá.
  const sidebarCompacto = useSidebarStore((state) => state.compacto);

  const emailUsuario =
    typeof user === "string"
      ? user
      : user?.email
        ? String(user.email)
        : "Usuario";

  // La denominación (nombre visible elegido por el usuario, ver "Mi cuenta"
  // en PerfilModal) es el dato principal del menú; el email queda como
  // secundario. Mismo query que ya usa PerfilModal (misma queryKey).
  const { data: usuarioDb } = useObtenerPorNombreOEmail(user ? emailUsuario : "");
  const denominacion = (
    extraerRegistroUsuario(usuarioDb)?.denominacion ||
    extraerRegistroUsuario(usuarioDb)?.Denominacion ||
    ""
  ).trim();
  const nombrePrincipal = denominacion || emailUsuario;
  const inicialesUsuario = obtenerInicialesEmpresa(denominacion || emailUsuario.split("@")[0]);
  const rolUsuario = isVendor ? "Vendor" : isVinculado ? "Socio" : "Sin empresa";


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate(`${basePath}/login`);
  };

  // Logout "suave": tira formularios/empresa activa/verificación de
  // términos de la sesión anterior (ver cambiarEmpresa en useAuthStore) pero
  // conserva user/isAuthenticated. Solo para vendors.
  const handleCambiarEmpresa = () => {
    setIsDropdownOpen(false);
    cambiarEmpresa();
    navigate(`${basePath}/seleccionar-empresa`);
  };

  const handleOpenHelp = () => {
    document.dispatchEvent(new CustomEvent("bindHelp:toggle"));
  };

  const irAlInicio = () => navigate(`${basePath}${isSolicitudesEnabled ? "/solicitudes" : "/legajo"}`);

  return (
    <header className={styles.header}>
      <div className={styles.izquierda}>
        <button type="button" className={styles.menuButton} onClick={onToggleSidebar} aria-label="Abrir menú">
          <FiMenu />
        </button>

        <button type="button" className={styles.logoContainer} onClick={irAlInicio} aria-label="Ir al inicio">
          <img src={theme === "light" ? logoBindBlack : logoBind} alt="Bind Garantías" className={styles.logo} />
          {channelInfo.id !== "default" && channelInfo.logo && (
            <>
              <span className={styles.logoSeparator} aria-hidden="true" />
              <img src={channelInfo.logo} alt={channelInfo.nombre} className={styles.channelLogo} />
            </>
          )}
        </button>

        {sidebarCompacto && isVinculado && (
          <span className={styles.empresaPill} title={nombreEmpresa}>
            <span className={styles.empresaPillAvatar} aria-hidden="true">
              {obtenerInicialesEmpresa(nombreEmpresa)}
            </span>
            <span className={styles.empresaPillNombre}>{nombreEmpresa}</span>
          </span>
        )}


        {/* En mobile la identidad de vendor vive en el sidebar (ver
            Sidebar.jsx); acá va compacta, sin repetir el email. */}
        {isVendor && (
          <span className={styles.vendorBadge}>
            <FiBriefcase className={styles.vendorBadgeIcon} aria-hidden="true" />
            Vendor
          </span>
        )}
      </div>

      <div className={styles.derecha}>
        {LIGHT_MODE_ENABLED && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          >
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </button>
        )}

        {user ? (
          <>
            {/* Sin contenido de ayuda escrito todavía para algunas pantallas
                (ej. Seleccionar Empresa) - mejor ocultar el botón ahí que
                abrir un drawer vacío. */}
            {!hideHelpButton && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleOpenHelp}
                aria-label="Abrir ayuda"
                title="Centro de ayuda"
              >
                <FiHelpCircle />
              </button>
            )}

            <div className={styles.userMenuContainer} ref={dropdownRef}>
              <button
                type="button"
                className={`${styles.userTrigger} ${isDropdownOpen ? styles.userTriggerAbierto : ""}`}
                onClick={() => setIsDropdownOpen((abierto) => !abierto)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                title={nombrePrincipal}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {inicialesUsuario}
                </span>
                <span className={styles.userNombre}>{nombrePrincipal}</span>
                <FiChevronDown className={`${styles.chevron} ${isDropdownOpen ? styles.chevronAbierto : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdownMenu} role="menu">
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownAvatar} aria-hidden="true">
                      {inicialesUsuario}
                    </span>
                    <div className={styles.dropdownIdentidad}>
                      <div className={styles.dropdownNombreFila}>
                        <p className={styles.dropdownNombre}>{nombrePrincipal}</p>
                        <span
                          className={`${styles.rolPill} ${!isVinculado && !isVendor ? styles.rolPillNeutro : ""}`}
                        >
                          {rolUsuario}
                        </span>
                      </div>
                      {!!denominacion && <p className={styles.dropdownEmail}>{emailUsuario}</p>}
                      {isVinculado && <p className={styles.dropdownEmail}>{nombreEmpresa}</p>}
                    </div>
                  </div>

                  <div className={styles.dropdownLista}>
                    <button
                      type="button"
                      role="menuitem"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsPerfilModalOpen(true);
                      }}
                    >
                      <span className={styles.dropdownItemIcono} aria-hidden="true">
                        <FiUser />
                      </span>
                      <span className={styles.dropdownItemTexto}>
                        <span className={styles.dropdownItemLabel}>Mi perfil</span>
                        <span className={styles.dropdownItemAyuda}>Tus datos y tu cuenta</span>
                      </span>
                      <FiChevronRight className={styles.dropdownItemFlecha} aria-hidden="true" />
                    </button>

                    {/* Solo tiene sentido si ya hay una empresa activa para
                        "cambiar" — sin eso ya existe el botón "Volver a
                        Inicio" en Paso1Cuit/BarraProgreso. */}
                    {isVendor && isVinculado && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.dropdownItem}
                        onClick={handleCambiarEmpresa}
                      >
                        <span className={styles.dropdownItemIcono} aria-hidden="true">
                          <FiRepeat />
                        </span>
                        <span className={styles.dropdownItemTexto}>
                          <span className={styles.dropdownItemLabel}>Cambiar empresa</span>
                          <span className={styles.dropdownItemAyuda}>Gestionar otra empresa</span>
                        </span>
                        <FiChevronRight className={styles.dropdownItemFlecha} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className={styles.dropdownDivisor} />

                  <div className={styles.dropdownLista}>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${styles.dropdownItem} ${styles.dropdownItemPeligro}`}
                      onClick={handleLogout}
                    >
                      <span className={styles.dropdownItemIcono} aria-hidden="true">
                        <FiLogOut />
                      </span>
                      <span className={styles.dropdownItemLabel}>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className={styles.loginContainer}>
            {texto}{" "}
            <button
              type="button"
              className={styles.link}
              onClick={() =>
                navigate(`${basePath}${rutaDestino.startsWith("/") ? rutaDestino : "/" + rutaDestino}`)
              }
            >
              {textoEnlace}
            </button>
          </p>
        )}
      </div>

      <PerfilModal isOpen={isPerfilModalOpen} onClose={() => setIsPerfilModalOpen(false)} />
    </header>
  );
};

export default Navbar;

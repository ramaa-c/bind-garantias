import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FiChevronDown, FiLogOut } from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import styles from "./AdminNavbar.module.css";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useChannel } from "../../../../context/ChannelContext";
import { useAdminRestrictions } from "../../../../hooks/useAdminRestrictions";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cadenaSlug } = useParams();
  const { channelInfo } = useChannel();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const { isRestricted } = useAdminRestrictions();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (clearAuth) clearAuth();
    navigate("/default/login");
  };

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleNavigate = (path) => {
    if (!path) return;
    setActiveDropdown(null);
    navigate(path);
  };

  const adminMenu = [
    "Cadenas de Valor",
    "Líneas",
    "Cotización de divisas",
    "Destinatarios",
    "Disclaimers",
    "Administrar Email",
    "Líneas de Crédito",
    "Propiedades de la aplicación",
    "Preguntas frecuentes",
    "Noticias",
    "Canal comercial",
    "Campañas",
    "Roles",
    "Sociedades de bolsa",
    "Administradores",
    "Precalificación",
    "Validaciones de CUITs de administrador",
    "NPS",
    "Banners",
    "Representantes",
    "Conceptos",
    "Conceptos Genéricos",
    "SgrPlus Codes",
    "Administrar Usuarios públicos",
  ];

  return (
    <div className={styles.navWrapper}>
      {/* Topmost branding bar */}
      <div className={styles.topBrandBar}>
        <div className={styles.logoBox} role="button" tabIndex={0} onClick={() => navigate("/admin/dashboard")}>
          <img src={logoBind} alt="BIND Logo" className={styles.logoImg} />
          {!isRestricted && <span className={styles.adminTag}>ADMIN</span>}
        </div>
        <div className={styles.userMenuContainer} ref={profileRef}>
          <div
            className={styles.userTrigger}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className={styles.avatarWrapper}>
              <FaRegUserCircle className={styles.userIcon} />
            </div>
            <span className={styles.userName}>
              {user?.nombre || user?.email || "Administrador"}
            </span>
            <FiChevronDown
              className={`${styles.userChevron} ${isProfileOpen ? styles.userChevronOpen : ""}`}
            />
          </div>

          {isProfileOpen && (
            <div className={styles.userDropdownMenu}>
              <div className={styles.userDropdownHeader}>
                <p className={styles.userDropdownEmail}>
                  {user?.email || "admin"}
                </p>
                <p className={styles.userDropdownRole}>
                  Administrador General
                </p>
              </div>

              <div className={styles.userDropdownFooter}>
                <button type="button" className={styles.userLogoutBtn} onClick={handleLogout}>
                  Cerrar sesión <FiLogOut />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main navigation links bar mimicking the blue header */}
      <nav className={styles.mainNav} ref={navRef}>
        <div className={styles.navItemsContainer}>
          {/* Mis Pendientes */}
          <button type="button"
            className={`${styles.navButton} ${
              isActive("/admin/dashboard") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin/dashboard")}
          >
            Mis Pendientes
          </button>

          {!isRestricted && (
            <>
              {/* Tasas */}
          <button type="button"
            className={`${styles.navButton} ${
              isActive("/admin/tasas-montos") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin/tasas-montos")}
          >
            Tasas
          </button>

          {/* Criterios de Aceptación */}
          <button type="button"
            className={`${styles.navButton} ${
              isActive("/admin/terminos") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin/terminos")}
          >
            Criterios de Aceptación
          </button>

          {/* Administración Dropdown */}
          <div className={styles.dropdownContainer}>
            <button type="button"
              className={`${styles.navButton} ${
                activeDropdown === "administracion" ? styles.dropdownActive : ""
              }`}
              onClick={() => toggleDropdown("administracion")}
            >
              Administración <FiChevronDown className={styles.chevron} />
            </button>
            {activeDropdown === "administracion" && (
              <div className={`${styles.dropdownMenu} ${styles.scrollableMenu}`}>
                {adminMenu.map((item) => {
                  let destPath = null;
                  if (item === "Roles" || item === "Administradores") {
                    destPath = "/admin/roles-permisos";
                  } else if (item === "Banners") {
                    destPath = "/admin/banners";
                  } else if (item === "Cadenas de Valor") {
                    destPath = "/admin/cadenas-valor";
                  } else if (item === "Líneas") {
                    destPath = "/admin/lineas-productos";
                  } else if (item.includes("Líneas") || item.includes("Crédito")) {
                    destPath = "/admin/tasas-montos";
                  }

                  return (
                    <button type="button"
                      key={item}
                      className={styles.dropdownItem}
                      onClick={() => handleNavigate(destPath)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Soporte */}
          <div className={styles.dropdownContainer}>
            <button type="button"
              className={`${styles.navButton} ${
                activeDropdown === "soporte" ? styles.dropdownActive : ""
              }`}
              onClick={() => toggleDropdown("soporte")}
            >
              Soporte <FiChevronDown className={styles.chevron} />
            </button>
            {activeDropdown === "soporte" && (
              <div className={styles.dropdownMenu}>
                <button type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate(null)}
                >
                  Mesa de Ayuda
                </button>
                <button type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate(null)}
                >
                  Contactar Soporte Técnico
                </button>
              </div>
            )}
          </div>



          {/* Ayuda */}
          <div className={styles.dropdownContainer}>
            <button type="button"
              className={`${styles.navButton} ${
                activeDropdown === "ayuda" ? styles.dropdownActive : ""
              }`}
              onClick={() => toggleDropdown("ayuda")}
            >
              Ayuda <FiChevronDown className={styles.chevron} />
            </button>
            {activeDropdown === "ayuda" && (
              <div className={styles.dropdownMenu}>
                <button type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate(null)}
                >
                  Manual de Usuario
                </button>
                <button type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate(null)}
                >
                  Acerca de Bind Garantías
                </button>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiSettings } from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import styles from "./AdminNavbar.module.css";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useAdminRestrictions } from "../../../../hooks/useAdminRestrictions";
import { CuentaUsuarioModal } from "../../../features/admin/CuentaUsuarioModal/CuentaUsuarioModal";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const { isRestricted } = useAdminRestrictions();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  const navRef = useRef(null);
  const profileRef = useRef(null);

  // AdminGuard ya resuelve el registro real del usuario y corrige
  // user.nombre (denominación real, o el email si no tiene una cargada) en
  // cuanto lo conoce, así que acá alcanza con leer el store.
  const nombreMostrado = user?.nombre || user?.email || "Administrador";

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
    navigate("/login");
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
    "CDAs Globales",
    "CDAs por Cadena",
    "Líneas",
    "CDAs Alta de Línea",
    "Productos de Líneas",
    "Modo Offline",
  ];

  return (
    <div className={styles.navWrapper}>
      {/* Topmost branding bar */}
      <div className={styles.topBrandBar}>
        <div className={styles.logoBox} role="button" tabIndex={0} onClick={() => navigate("/admin")}>
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
            <span className={styles.userName}>{nombreMostrado}</span>
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
                  Administrador
                </p>
              </div>

              <div className={styles.userDropdownFooter}>
                <button
                  type="button"
                  className={styles.userAccountBtn}
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsCuentaModalOpen(true);
                  }}
                >
                  Mi cuenta <FiSettings />
                </button>
                <button type="button" className={styles.userLogoutBtn} onClick={handleLogout}>
                  Cerrar sesión <FiLogOut />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CuentaUsuarioModal
        isOpen={isCuentaModalOpen}
        onClose={() => setIsCuentaModalOpen(false)}
      />

      {/* Main navigation links bar mimicking the blue header */}
      <nav className={styles.mainNav} ref={navRef}>
        <div className={styles.navItemsContainer}>
          {/* Mis Pendientes */}
          <button type="button"
            className={`${styles.navButton} ${
              isActive("/admin") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin")}
          >
            Mis Pendientes
          </button>

          {!isRestricted && (
            <>

          {/* Empresas */}
          <button type="button"
            className={`${styles.navButton} ${
              isActive("/admin/empresas") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin/empresas")}
          >
            Empresas
          </button>

          {/* Términos y Condiciones */}
          <button type="button"
            className={`${styles.navButton} ${
              isActive("/admin/terminos") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin/terminos")}
          >
            Términos y Condiciones
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
                  if (item === "Cadenas de Valor") {
                    destPath = "/admin/cadenas-valor";
                  } else if (item === "CDAs Globales") {
                    destPath = "/admin/cdas";
                  } else if (item === "CDAs por Cadena") {
                    destPath = "/admin/cadenas-cda";
                  } else if (item === "Líneas") {
                    destPath = "/admin/lineas-cadenas";
                  } else if (item === "CDAs Alta de Línea") {
                    destPath = "/admin/lineas-cda";
                  } else if (item === "Productos de Líneas") {
                    destPath = "/admin/lineas-productos";
                  } else if (item === "Modo Offline") {
                    destPath = "/admin/modo-offline";
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

            {/* Ocultados Ayuda y Soporte por el momento */}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

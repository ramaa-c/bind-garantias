import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import styles from "./AdminNavbar.module.css";
import { useAuthStore } from "../../../../store/useAuthStore";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (clearAuth) clearAuth();
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleNavigate = (path) => {
    setActiveDropdown(null);
    navigate(path);
  };

  const adminMenu = [
    "Cadenas de Valor",
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
    "Líneas",
    "Administrar Usuarios públicos",
  ];

  return (
    <div className={styles.navWrapper}>
      {/* Topmost branding bar */}
      <div className={styles.topBrandBar}>
        <div className={styles.logoBox} onClick={() => navigate("/admin/dashboard")}>
          <img src={logoBind} alt="BIND Logo" className={styles.logoImg} />
          <span className={styles.adminTag}>ADMIN</span>
        </div>
        <div className={styles.userControls}>
          <span className={styles.accountText}>
            <FiUser /> {user?.nombre || "Administrador"}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Salir <FiLogOut />
          </button>
        </div>
      </div>

      {/* Main navigation links bar mimicking the blue header */}
      <nav className={styles.mainNav} ref={navRef}>
        <div className={styles.navItemsContainer}>
          {/* Mis Pendientes */}
          <button
            className={`${styles.navButton} ${
              isActive("/admin/dashboard") ? styles.active : ""
            }`}
            onClick={() => handleNavigate("/admin/dashboard")}
          >
            Mis Pendientes
          </button>

          {/* Bind Garantías Dropdown */}
          <div className={styles.dropdownContainer}>
            <button
              className={`${styles.navButton} ${
                activeDropdown === "garantias" ? styles.dropdownActive : ""
              }`}
              onClick={() => toggleDropdown("garantias")}
            >
              Bind Garantías <FiChevronDown className={styles.chevron} />
            </button>
            {activeDropdown === "garantias" && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/tasas-montos?tab=lineas")}
                >
                  Líneas
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/tasas-montos?tab=cheques")}
                >
                  Cheques
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/tasas-montos?tab=pagares")}
                >
                  Pagarés
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/tasas-montos?tab=prestamos")}
                >
                  Préstamos
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/dashboard")}
                >
                  Precalificaciones
                </button>
              </div>
            )}
          </div>

          {/* Criterios de Aceptación */}
          <button
            className={styles.navButton}
            onClick={() => handleNavigate("/admin/terminos")}
          >
            Criterios de Aceptación
          </button>

          {/* Administración Dropdown */}
          <div className={styles.dropdownContainer}>
            <button
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
                  let destPath = "/admin/dashboard";
                  if (item === "Roles" || item === "Administradores") {
                    destPath = "/admin/roles-permisos";
                  } else if (item === "Banners") {
                    destPath = "/admin/banners";
                  } else if (item === "Cadenas de Valor") {
                    destPath = "/admin/cadenas-valor";
                  } else if (item === "Disclaimers" || item === "Propiedades de la aplicación") {
                    destPath = "/admin/terminos";
                  } else if (item.includes("Líneas") || item.includes("Crédito")) {
                    destPath = "/admin/tasas-montos";
                  }

                  return (
                    <button
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
            <button
              className={`${styles.navButton} ${
                activeDropdown === "soporte" ? styles.dropdownActive : ""
              }`}
              onClick={() => toggleDropdown("soporte")}
            >
              Soporte <FiChevronDown className={styles.chevron} />
            </button>
            {activeDropdown === "soporte" && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/dashboard")}
                >
                  Mesa de Ayuda
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/dashboard")}
                >
                  Contactar Soporte Técnico
                </button>
              </div>
            )}
          </div>

          {/* Herramientas */}
          <button
            className={styles.navButton}
            onClick={() => handleNavigate("/admin/tasas-montos")}
          >
            Herramientas
          </button>

          {/* Ayuda */}
          <div className={styles.dropdownContainer}>
            <button
              className={`${styles.navButton} ${
                activeDropdown === "ayuda" ? styles.dropdownActive : ""
              }`}
              onClick={() => toggleDropdown("ayuda")}
            >
              Ayuda <FiChevronDown className={styles.chevron} />
            </button>
            {activeDropdown === "ayuda" && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/terminos")}
                >
                  Manual de Usuario
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleNavigate("/admin/dashboard")}
                >
                  Acerca de Bind Garantías
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

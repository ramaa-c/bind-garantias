import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown, FiChevronRight, FiLogOut, FiMenu, FiSettings, FiX } from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import styles from "./AdminNavbar.module.css";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useAdminRestrictions } from "../../../../hooks/useAdminRestrictions";
import { useChannel } from "../../../../context/useChannel";
import { CuentaUsuarioModal } from "../../../features/admin/CuentaUsuarioModal/CuentaUsuarioModal";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const { isRestricted, cadenas } = useAdminRestrictions();
  const { modoPorHost } = useChannel();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const navRef = useRef(null);
  const profileRef = useRef(null);

  // AdminGuard ya resuelve el registro real del usuario y corrige
  // user.nombre (denominación real, o el email si no tiene una cargada) en
  // cuanto lo conoce, así que acá alcanza con leer el store.
  const nombreMostrado = user?.nombre || user?.email || "Administrador";
  const iniciales =
    nombreMostrado
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "A";

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

  // Un UsuarioCadenaValor (admin restringido a su/s cadena/s, ver
  // Login.jsx → resolverDestinoPostLogin) entró por el login de cliente de
  // su banco, no por el de admin — al desloguearse tiene que volver ahí, no
  // a /login (que es el ingreso de un Administrador General). En
  // modo-por-host ya estamos en el dominio correcto de ese banco, así que
  // "/login" ahí adentro ES el login de cliente — solo en modo legacy hace
  // falta reconstruir /{cadenaId}/login a mano.
  const handleLogout = () => {
    if (clearAuth) clearAuth();

    if (!modoPorHost && isRestricted && cadenas.length > 0) {
      const cadenaId = cadenas[0]?.cadenavalorid ?? cadenas[0]?.CadenaValorID;
      if (cadenaId) {
        navigate(`/${cadenaId}/login`);
        return;
      }
    }

    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleNavigate = (path) => {
    if (!path) return;
    setActiveDropdown(null);
    setMenuMovilAbierto(false);
    navigate(path);
  };

  // Agrupados por dominio en vez de un único dropdown "Administración" con
  // los 9 sueltos (quedó sobrepoblado e ilegible, ver charla del 2026-09-21) -
  // Términos y Condiciones se sumó acá adentro (antes vivía como botón de
  // primer nivel) porque encaja con el resto de Configuración tanto como
  // cualquiera de esos.
  const gruposMenu = [
    {
      key: "cadenas",
      label: "Cadenas de Valor",
      items: [
        { label: "Cadenas de Valor", path: "/admin/cadenas-valor" },
        { label: "Líneas", path: "/admin/lineas-cadenas" },
        { label: "Productos de Líneas", path: "/admin/lineas-productos" },
      ],
    },
    {
      key: "cdas",
      label: "CDAs",
      items: [
        { label: "CDAs Globales", path: "/admin/cdas" },
        { label: "CDAs por Cadena", path: "/admin/cadenas-cda" },
        { label: "CDAs Alta de Línea", path: "/admin/lineas-cda" },
      ],
    },
    {
      key: "configuracion",
      label: "Configuración",
      items: [
        { label: "Usuarios", path: "/admin/usuarios" },
        { label: "Relaciones de Terceros", path: "/admin/tipos-relacion-socio" },
        { label: "Variables Parametrizables", path: "/admin/variables-parametrizacion" },
        { label: "Modo Offline", path: "/admin/modo-offline" },
        { label: "Términos y Condiciones", path: "/admin/terminos" },
      ],
    },
  ];

  const grupoContieneRutaActiva = (grupo) =>
    grupo.items.some((item) => isActive(item.path));

  return (
    <div className={`${styles.navWrapper} ${menuMovilAbierto ? styles.navWrapperAbierto : ""}`}>
      <div className={styles.logoBox} role="button" tabIndex={0} onClick={() => navigate("/admin")}>
        <img src={logoBind} alt="BIND Logo" className={styles.logoImg} />
        {!isRestricted && <span className={styles.adminTag}>ADMIN</span>}
      </div>

      <nav
        className={`${styles.mainNav} ${menuMovilAbierto ? styles.mainNavAbierto : ""}`}
        ref={navRef}
      >
        <div className={styles.navItemsContainer}>
          <button
            type="button"
            className={`${styles.navButton} ${isActive("/admin") ? styles.active : ""}`}
            onClick={() => handleNavigate("/admin")}
          >
            Mis Pendientes
          </button>

          {!isRestricted && (
            <>
              <button
                type="button"
                className={`${styles.navButton} ${isActive("/admin/empresas") ? styles.active : ""}`}
                onClick={() => handleNavigate("/admin/empresas")}
              >
                Empresas
              </button>

              {gruposMenu.map((grupo) => (
                <div className={styles.dropdownContainer} key={grupo.key}>
                  <button
                    type="button"
                    className={`${styles.navButton} ${
                      activeDropdown === grupo.key ? styles.dropdownActive : ""
                    } ${grupoContieneRutaActiva(grupo) ? styles.active : ""}`}
                    aria-expanded={activeDropdown === grupo.key}
                    onClick={() => toggleDropdown(grupo.key)}
                  >
                    {grupo.label} <FiChevronDown className={styles.chevron} />
                  </button>
                  {activeDropdown === grupo.key && (
                    <div className={`${styles.dropdownMenu} ${styles.scrollableMenu}`}>
                      {grupo.items.map((item) => (
                        <button
                          type="button"
                          key={item.path}
                          className={`${styles.dropdownItem} ${isActive(item.path) ? styles.dropdownItemActive : ""}`}
                          onClick={() => handleNavigate(item.path)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </nav>

      <div className={styles.userMenuContainer} ref={profileRef}>
        <button
          type="button"
          className={`${styles.userTrigger} ${isProfileOpen ? styles.userTriggerOpen : ""}`}
          aria-expanded={isProfileOpen}
          title={nombreMostrado}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <span className={styles.avatarWrapper} aria-hidden="true">
            {iniciales}
          </span>
          <span className={styles.userName}>{nombreMostrado}</span>
          <FiChevronDown
            className={`${styles.userChevron} ${isProfileOpen ? styles.userChevronOpen : ""}`}
          />
        </button>

        {isProfileOpen && (
          <div className={styles.userDropdownMenu} role="menu">
            <div className={styles.userDropdownHeader}>
              <span className={styles.userDropdownAvatar} aria-hidden="true">
                {iniciales}
              </span>
              <div className={styles.userDropdownIdentity}>
                <div className={styles.userDropdownNameRow}>
                  <p className={styles.userDropdownName}>{nombreMostrado}</p>
                  <span className={styles.userDropdownRole}>Admin</span>
                </div>
                <p className={styles.userDropdownEmail}>{user?.email || "admin"}</p>
              </div>
            </div>

            <div className={styles.userDropdownList}>
              <button
                type="button"
                role="menuitem"
                className={styles.userDropdownItem}
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsCuentaModalOpen(true);
                }}
              >
                <span className={styles.userDropdownItemIcon}>
                  <FiSettings />
                </span>
                <span className={styles.userDropdownItemText}>
                  <span className={styles.userDropdownItemLabel}>Mi cuenta</span>
                  <span className={styles.userDropdownItemHint}>Usuario y contraseña</span>
                </span>
                <FiChevronRight className={styles.userDropdownItemArrow} />
              </button>
            </div>

            <div className={styles.userDropdownDivider} />

            <div className={styles.userDropdownList}>
              <button
                type="button"
                role="menuitem"
                className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`}
                onClick={handleLogout}
              >
                <span className={styles.userDropdownItemIcon}>
                  <FiLogOut />
                </span>
                <span className={styles.userDropdownItemLabel}>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.menuToggle}
        aria-label={menuMovilAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuMovilAbierto}
        onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
      >
        {menuMovilAbierto ? <FiX /> : <FiMenu />}
      </button>

      <CuentaUsuarioModal
        isOpen={isCuentaModalOpen}
        onClose={() => setIsCuentaModalOpen(false)}
      />
    </div>
  );
}

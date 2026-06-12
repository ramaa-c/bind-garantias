import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import {
  FiMenu,
  FiChevronDown,
  FiTrendingUp,
  FiHelpCircle,
} from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import styles from "./Navbar.module.css";
import { TasasModal } from "../../../features/shared/TasasModal/TasasModal";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useChannel } from "../../../../context/ChannelContext";

const Navbar = ({
  texto = "¿No tenés cuenta?",
  textoEnlace = "Registrate",
  rutaDestino = "/registro",
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTasasModalOpen, setIsTasasModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { channelInfo } = useChannel();
  
  const { nombreEmpresa } = useEmpresaActiva();
  const isVinculado = !!nombreEmpresa;

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
          <FiMenu size={24} color="#fff" />
        </button>
        <div className={styles.logoContainer} role="button" tabIndex={0} onClick={() => navigate(`/${channelInfo.id}/solicitudes`)}>
          <img src={logoBind} alt="Bind Garantías" className={styles.logo} />
          {channelInfo.id !== "default" && (
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
      </div>

      <div className={styles.rightSection}>
        {user ? (
          <>
            {/* Botón de Ayuda Restaurado */}
            <button type="button"
              className={styles.helpButton}
              onClick={handleOpenHelp}
              aria-label="Abrir ayuda"
              title="Centro de Ayuda"
            >
              <FiHelpCircle className={styles.helpIcon} />
            </button>

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
                      {isVinculado ? "Socio activo" : "No vinculado"}
                    </p>
                  </div>

                  {isVinculado && (
                    <div className={styles.dropdownBody}>
                      <button type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsTasasModalOpen(true);
                        }}
                      >
                        <FiTrendingUp className={styles.itemIcon} /> Tasas vigentes
                      </button>
                    </div>
                  )}

                  <div className={styles.dropdownFooter}>
                    <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                      Cerrar sesión
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
    </header>
  );
};

export default Navbar;

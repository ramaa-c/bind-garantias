import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import {
  FiMenu,
  FiChevronDown,
  FiFileText,
  FiFolder,
  FiTrendingUp,
} from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./Navbar.module.css";
import { TasasModal } from "../../features/TasasModal/TasasModal";

const Navbar = ({
  texto,
  textoEnlace,
  rutaDestino,
  usuario,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTasasModalOpen, setIsTasasModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuAction = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {onToggleSidebar && (
          <button
            className={styles.menuButton}
            onClick={onToggleSidebar}
            aria-label="Alternar menú"
          >
            <FiMenu size={24} color="var(--white)" />
          </button>
        )}

        <div
          className={styles.logoContainer}
          onClick={() => navigate("/inicio")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/");
            }
          }}
        >
          <img src={logoBind} alt="Logo BIND" className={styles.logo} />
        </div>
      </div>

      {usuario ? (
        <div className={styles.userSection} ref={dropdownRef}>
          <button
            className={styles.userButton}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className={styles.userIcon}>
              <FaRegUserCircle size={20} color={"var(--yellow, #f5f400)"} />
            </span>
            <span className={styles.userName}>{usuario}</span>
            <FiChevronDown
              className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>{usuario}</span>
                <span className={styles.dropdownSubtitle}>Administrador</span>
              </div>

              <div className={styles.dropdownBody}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleMenuAction("/solicitudes")}
                >
                  <FiFileText className={styles.itemIcon} /> Mis solicitudes
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleMenuAction("/documentacion")}
                >
                  <FiFolder className={styles.itemIcon} /> Documentación
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsTasasModalOpen(true);
                  }}
                >
                  <FiTrendingUp className={styles.itemIcon} /> Tasas
                </button>
              </div>

              <div className={styles.dropdownFooter}>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        texto &&
        textoEnlace && (
          <div className={styles.loginContainer}>
            {texto}
            <span
              className={styles.link}
              onClick={() => navigate(rutaDestino)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(rutaDestino);
                }
              }}
            >
              {textoEnlace}
            </span>
          </div>
        )
      )}

      <TasasModal
        isOpen={isTasasModalOpen}
        onClose={() => setIsTasasModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;

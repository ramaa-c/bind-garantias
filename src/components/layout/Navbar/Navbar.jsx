import React from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./Navbar.module.css";

const Navbar = ({
  texto,
  textoEnlace,
  rutaDestino,
  usuario,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();

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

        {/* Logo */}
        <div
          className={styles.logoContainer}
          onClick={() => navigate("/")}
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

      {/* Lado derecho */}
      {usuario ? (
        <div className={styles.userContainer}>
          <span className={styles.userIcon}>
            <FaRegUserCircle size={20} color={"var(--yellow)"} />
          </span>
          <span className={styles.userName}>{usuario}</span>
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
    </header>
  );
};

export default Navbar;

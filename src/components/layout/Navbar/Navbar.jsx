import React from "react";
import { useNavigate } from "react-router-dom";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import { FaRegUserCircle } from "react-icons/fa";
import styles from "./Navbar.module.css";

const Navbar = ({ texto, textoEnlace, rutaDestino, usuario }) => {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      
      {/* Logo */}
      <div
        className={styles.logoContainer}
        onClick={() => navigate("/")}
      >
        <img
          src={logoBind}
          alt="Logo BIND"
          className={styles.logo}
        />
      </div>

      {/* Lado derecho */}
      {usuario ? (
        <div className={styles.userContainer}>
          <span className={styles.userIcon}>
            <FaRegUserCircle size={20} color={"var(--yellow)"} />
          </span>
          {usuario}
        </div>
      ) : (
        texto &&
        textoEnlace && (
          <div className={styles.loginContainer}>
            {texto}
            <span
              className={styles.link}
              onClick={() => navigate(rutaDestino)}
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
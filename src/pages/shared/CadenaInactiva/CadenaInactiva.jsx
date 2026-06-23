import React from "react";
import { useLocation } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./CadenaInactiva.module.css";

const CadenaInactiva = () => {
  const location = useLocation();
  const denominacion = location.state?.denominacion || "valor";

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img src={logoBind} alt="Logo BIND Garantías" className={styles.logo} />
        <FiAlertCircle size={80} className={styles.icon} />
        <h2 className={styles.title}>Plataforma Inactiva</h2>
        <p className={styles.message}>
          La cadena de <strong>{denominacion}</strong> se encuentra inactiva en este momento.
        </p>
      </main>
    </div>
  );
};

export default CadenaInactiva;

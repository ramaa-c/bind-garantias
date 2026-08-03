import React from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import { Button } from "../../../components/ui/Button/Button";
import styles from "./ErrorServicio.module.css";

const MENSAJE_ERROR =
  "No pudimos comunicarnos con la plataforma. Puede tratarse de un inconveniente momentáneo del servicio; volvé a intentarlo en unos instantes.";

const ErrorServicio = ({ onReintentar, reintentando = false }) => {
  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img src={logoBind} alt="Logo BIND Garantías" className={styles.logo} />
        <div className={styles.iconWrap}>
          <FiAlertTriangle size={64} className={styles.icon} />
        </div>
        <h2 className={styles.title}>No pudimos conectar con el servicio</h2>
        <p className={styles.message}>{MENSAJE_ERROR}</p>
        {onReintentar && (
          <Button onClick={onReintentar} disabled={reintentando}>
            <FiRefreshCw
              size={16}
              className={reintentando ? styles.iconGirando : undefined}
            />
            {reintentando ? "Reintentando..." : "Reintentar"}
          </Button>
        )}
      </main>
    </div>
  );
};

export default ErrorServicio;

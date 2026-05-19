import React from "react";
import { useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { Button } from "../../../components/ui";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./NotFound.module.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img src={logoBind} alt="Logo BIND Garantías" className={styles.logo} />
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Ups, página no encontrada</h2>
        <p className={styles.message}>
          La ruta a la que intentás acceder no existe, ha sido movida o no está
          disponible en este momento.
        </p>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/", { replace: true })}
            icon={<FiHome size={20} />}
          >
            VOLVER AL INICIO
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;

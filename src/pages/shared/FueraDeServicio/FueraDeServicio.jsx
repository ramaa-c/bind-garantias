import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTool } from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import { useObtenerStatusPlataforma } from "../../../hooks/useStatusPlataforma";
import { obtenerUltimoStatus, esOffline } from "../../../utils/statusPlataforma";
import styles from "./FueraDeServicio.module.css";

const MENSAJE_MANTENIMIENTO =
  "Estamos realizando tareas de mantenimiento programado. Por favor, volvé a intentarlo en unos minutos.";

const FueraDeServicio = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useObtenerStatusPlataforma();
  const activo = esOffline(obtenerUltimoStatus(data));

  useEffect(() => {
    if (!isLoading && !activo) {
      navigate("/", { replace: true });
    }
  }, [activo, isLoading, navigate]);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img src={logoBind} alt="Logo BIND Garantías" className={styles.logo} />
        <div className={styles.iconWrap}>
          <FiTool size={64} className={styles.icon} />
        </div>
        <h2 className={styles.title}>Plataforma en mantenimiento</h2>
        <p className={styles.message}>{MENSAJE_MANTENIMIENTO}</p>
      </main>
    </div>
  );
};

export default FueraDeServicio;

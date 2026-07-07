import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTool } from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import { useModoOffline } from "../../../hooks/useModoOffline";
import { MENSAJE_OFFLINE_DEFAULT } from "../../../utils/modoOffline";
import styles from "./FueraDeServicio.module.css";

const FueraDeServicio = () => {
  const navigate = useNavigate();
  const { activo, mensaje } = useModoOffline();

  useEffect(() => {
    if (!activo) {
      navigate("/", { replace: true });
    }
  }, [activo, navigate]);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img src={logoBind} alt="Logo BIND Garantías" className={styles.logo} />
        <div className={styles.iconWrap}>
          <FiTool size={64} className={styles.icon} />
        </div>
        <h2 className={styles.title}>Plataforma en mantenimiento</h2>
        <p className={styles.message}>{mensaje || MENSAJE_OFFLINE_DEFAULT}</p>
        <span className={styles.hint}>
          Esta página se actualiza sola apenas el servicio vuelva a estar disponible.
        </span>
      </main>
    </div>
  );
};

export default FueraDeServicio;

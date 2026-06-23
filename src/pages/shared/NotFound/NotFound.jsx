import React from "react";
import { useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { Button } from "../../../components/ui/Button/Button";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import styles from "./NotFound.module.css";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/ChannelContext";

const NotFound = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { channelInfo } = useChannel();

  const handleGoHome = () => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(`/${channelInfo.id}/solicitudes`, { replace: true });
      }
    } else {
      navigate("/", { replace: true });
    }
  };

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
            onClick={handleGoHome}
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

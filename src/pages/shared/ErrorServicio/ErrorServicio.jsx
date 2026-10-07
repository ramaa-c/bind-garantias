import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAlertTriangle, FiLogOut, FiRefreshCw } from "react-icons/fi";
import logoBind from "../../../assets/images/bind-g-logo.svg";
import { Button } from "../../../components/ui/Button/Button";
import { useAuthStore } from "../../../store/useAuthStore";
import { useChannel } from "../../../context/useChannel";
import styles from "./ErrorServicio.module.css";

const MENSAJE_ERROR =
  "No pudimos comunicarnos con la plataforma. Puede tratarse de un inconveniente momentáneo del servicio; volvé a intentarlo en unos instantes.";

const ErrorServicio = ({ onReintentar, reintentando = false }) => {
  const navigate = useNavigate();
  const { cadenaSlug } = useParams();
  const { modoPorHost } = useChannel();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleCerrarSesion = () => {
    clearAuth();
    const loginPath = !modoPorHost && cadenaSlug ? `/${cadenaSlug}/login` : "/login";
    navigate(loginPath, { replace: true });
  };

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img src={logoBind} alt="Logo BIND Garantías" className={styles.logo} />
        <div className={styles.iconWrap}>
          <FiAlertTriangle size={64} className={styles.icon} />
        </div>
        <h2 className={styles.title}>No pudimos conectar con el servicio</h2>
        <p className={styles.message}>{MENSAJE_ERROR}</p>
        <div className={styles.acciones}>
          {onReintentar && (
            <Button onClick={onReintentar} disabled={reintentando}>
              <FiRefreshCw
                size={16}
                className={reintentando ? styles.iconGirando : undefined}
              />
              {reintentando ? "Reintentando..." : "Reintentar"}
            </Button>
          )}
          {isAuthenticated && (
            <Button variant="outline" onClick={handleCerrarSesion}>
              <FiLogOut size={16} />
              Cerrar sesión
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ErrorServicio;

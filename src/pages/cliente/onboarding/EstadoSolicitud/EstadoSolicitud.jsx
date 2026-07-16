import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiClock, FiXCircle } from "react-icons/fi";
import { Button } from "../../../../components/ui";
import { useChannel } from "../../../../context/ChannelContext";
import { useAuthStore } from "../../../../store/useAuthStore";
import styles from "./EstadoSolicitud.module.css";

// Se muestra cuando el usuario ya cruzó el umbral (existe un socio con datos
// reales, vinculado) pero el CDA de PANTALLA_INGRESO_CUIT todavía no está
// aprobado — rechazado, o pendiente por una integración caída que el admin
// tiene que reactivar/re-ejecutar desde EmpresaDetalle. OnboardingGuard es
// quien decide llegar acá y manda el estado por location.state (mismo
// patrón que CadenaInactiva con la denominación).
export const EstadoSolicitud = () => {
  const { channelInfo } = useChannel();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const estado = location.state?.estado;

  const handleLogout = () => {
    clearAuth();
    navigate(`/${channelInfo.id}/login`);
  };

  const esRechazado = estado === "rechazado";

  const textos = esRechazado
    ? {
        titulo: "Solicitud rechazada",
        mensaje:
          "Tu solicitud no cumple con los criterios de aceptación requeridos. Si creés que esto es un error, contactá a soporte.",
      }
    : {
        titulo: "Solicitud en revisión",
        mensaje:
          "Estamos terminando de validar tu solicitud. Este proceso puede demorar; te vamos a avisar apenas esté lista.",
      };

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <img
          src={channelInfo.logo}
          alt={`Logo ${channelInfo.nombre}`}
          className={styles.logo}
        />
        {esRechazado ? (
          <FiXCircle size={72} className={styles.iconRechazado} />
        ) : (
          <FiClock size={72} className={styles.iconPendiente} />
        )}
        <h2 className={styles.title}>{textos.titulo}</h2>
        <p className={styles.message}>{textos.mensaje}</p>
        <div className={styles.actions}>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EstadoSolicitud;

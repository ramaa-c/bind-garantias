import React from "react";
import { FiCheckCircle, FiArrowLeft, FiClock } from "react-icons/fi";
import { Button } from "../../../ui";
import styles from "./Paso4ExitoPagare.module.css";

export default function Paso4ExitoPagare({ onVolverLista }) {
  return (
    <div className={styles.container}>
      
      {/* HERO DE ÉXITO */}
      <div className={styles.hero}>
        <div className={styles.heroGlow}></div>
        <div className={styles.heroContent}>
          <FiCheckCircle className={styles.heroIcon} />
          <div className={styles.heroText}>
            <span className={styles.heroSubtitle}>Solicitud N° 4362</span>
            <h1 className={styles.heroTitle}>
              ¡Felicitaciones!
              <br />
              Tu solicitud está aprobada
            </h1>
          </div>
        </div>
      </div>

      {/* TARJETA DE NOTIFICACIÓN */}
      <div className={styles.stepsContainer}>
        <div className={styles.stepCard}>
          <div className={styles.stepIconBadge}>
            <FiClock />
          </div>
          <div className={styles.stepContent}>
            <p className={styles.stepText}>
              Has finalizado todo el proceso necesario por tu parte. Nosotros
              estaremos avalando y vendiendo el pagaré.{" "}
              <strong>
                Apenas tengamos novedades nos estaremos poniendo en contacto con
                vos.
              </strong>
            </p>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* ACCIONES */}
      <div className={styles.actionsLeft}>
        <Button
          variant="outline"
          onClick={onVolverLista}
          style={{ border: 'none' }}
        >
          <FiArrowLeft className={styles.iconMarginRight} /> VOLVER A LA LISTA DE SOLICITUDES
        </Button>
      </div>
    </div>
  );
}
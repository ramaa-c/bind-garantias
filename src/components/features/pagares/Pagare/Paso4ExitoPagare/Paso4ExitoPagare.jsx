import React from "react";
import { FiCheckCircle, FiClock } from "react-icons/fi";
import { BotonVolver } from "../../../../ui"; // Cambiamos Button por BotonVolver
import styles from "./Paso4ExitoPagare.module.css";

export default function Paso4ExitoPagare({ onVolverLista }) {
  return (
    <div className={styles.container}>
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

      <div className={styles.actionsLeft}>
        <BotonVolver
          texto="VOLVER A LA LISTA DE SOLICITUDES"
          onClick={onVolverLista}
        />
      </div>
    </div>
  );
}
import React from "react";
import { FiClock, FiXCircle, FiInfo } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";

const EMAIL_SOPORTE = "soporte@bind.com.ar";

export function EstadoRevisionChip({ isAdmin = false }) {
  if (isAdmin) {
    return (
      <span
        className={`${styles.estadoRevisionChip} ${styles.estadoRevisionChipAdmin}`}
        title="Los CDAs activos para esta persona dieron rechazado. Podés reejecutarlos desde el detalle."
      >
        <FiXCircle size={11} /> CDA rechazado
      </span>
    );
  }

  return (
    <span
      className={`${styles.estadoRevisionChip} ${styles.estadoRevisionChipCliente}`}
      title="Estamos revisando los datos de esta persona. Desplegá la tarjeta para ver cómo seguir."
    >
      <FiClock size={11} /> En revisión
    </span>
  );
}

export function AvisoRevisionTercero() {
  return (
    <div className={styles.avisoRevisionTercero} role="note">
      <FiInfo size={14} className={styles.avisoRevisionTerceroIcono} aria-hidden="true" />
      <p className={styles.avisoRevisionTerceroTexto}>
        Estamos revisando los datos de esta persona. Para conocer su situación o completar
        información, escribinos a{" "}
        <a href={`mailto:${EMAIL_SOPORTE}`} className={styles.avisoRevisionTerceroLink}>
          {EMAIL_SOPORTE}
        </a>
        .
      </p>
    </div>
  );
}

export default EstadoRevisionChip;

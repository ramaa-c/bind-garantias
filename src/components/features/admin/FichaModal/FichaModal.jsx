import React from "react";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";
import styles from "./FichaModal.module.css";

export function FichaModal({ nombre, detalle, logo, icono, extra, tono }) {
  return (
    <div className={styles.ficha}>
      <span className={`${styles.avatar} ${tono === "peligro" ? styles.avatarPeligro : ""}`} aria-hidden="true">
        {logo ? <img src={logo} alt="" className={styles.logo} /> : icono || obtenerInicialesEmpresa(nombre || "?")}
      </span>
      <span className={styles.textos}>
        <strong className={styles.nombre} title={nombre}>{nombre}</strong>
        {detalle && <span className={styles.detalle}>{detalle}</span>}
      </span>
      {extra}
    </div>
  );
}

export default FichaModal;

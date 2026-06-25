import React from "react";
import { createPortal } from "react-dom";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen({ title, message, absolute = false }) {
  const content = (
    <div className={`${styles.overlay} ${absolute ? styles.absolute : ''}`}>
      <div className={styles.content}>
        <div className={styles.spinnerWrap}>
          <div className={styles.ring} />
          <div className={styles.ringInner} />
        </div>

        {title && <h3 className={styles.titulo}>{title}</h3>}
        {message && <p className={styles.mensaje}>{message}</p>}
      </div>
    </div>
  );

  if (absolute) {
    return content;
  }

  return createPortal(content, document.body);
}

export default LoadingScreen;

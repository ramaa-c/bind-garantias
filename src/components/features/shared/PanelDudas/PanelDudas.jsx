import React from "react";
import { ContenidoDudas } from "./ContenidoDudas";
import styles from "./PanelDudas.module.css";

export const PanelDudas = () => {
  return (
    <aside className={styles.panelContainer}>
      <ContenidoDudas />
    </aside>
  );
};
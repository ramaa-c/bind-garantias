import React from "react";
import { ContenidoDudas } from "./ContenidoDudas";
import styles from "./PanelDudas.module.css";

export const PanelDudas = ({ contexto = "cheques", pasoActual = 1 }) => {
  return (
    <aside className={styles.panelContainer}>
      <ContenidoDudas contexto={contexto} pasoActual={pasoActual} />
    </aside>
  );
};
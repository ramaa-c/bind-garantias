import React from "react";
import { Acordeon } from "../../../ui/Acordeon/Acordeon";
import styles from "./ContenidoDudas.module.css";

const PREGUNTAS_LEGAJO = [
  {
    p: "¿Por qué debo declarar a mis socios?",
    r: "Por normativas de la UIF, es obligatorio identificar a los beneficiarios finales de la sociedad.",
  },
  {
    p: "¿Qué pasa si un socio es extranjero?",
    r: "En caso de socios extranjeros, se requerirá documentación adicional respaldatoria apostillada.",
  },
];

export const ContenidoDudas = () => (
  <div className={styles.contenidoDudas}>
    <div className={styles.faqList}>
      {PREGUNTAS_LEGAJO.map((item) => (
        <Acordeon key={item.p} title={item.p}>
          <p className={styles.respuesta}>{item.r}</p>
        </Acordeon>
      ))}
    </div>
  </div>
);

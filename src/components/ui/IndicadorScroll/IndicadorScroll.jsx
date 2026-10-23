import React from "react";
import { useHayMasContenido } from "../../../hooks/useHayMasContenido";
import styles from "./IndicadorScroll.module.css";

// Corte suave en el borde inferior de un contenedor scrolleable mientras
// haya contenido abajo (pedido de clientes: en Rango 2 no se daban cuenta de
// que tenían que scrollear). Acompaña a la barra de scroll siempre visible
// (clase global scroll-visible); no hay botón porque tapaba contenido.
// Va como ÚLTIMO hijo del contenedor: es un ancla sticky de alto 0 pegada al
// borde inferior visible, así que no ocupa lugar y se oculta al llegar abajo.
export function IndicadorScroll({ contenedorRef }) {
  const hayMas = useHayMasContenido(contenedorRef);

  return (
    <div className={`${styles.ancla} ${hayMas ? styles.visible : ""}`} aria-hidden="true">
      <span className={styles.degrade} />
    </div>
  );
}

export default IndicadorScroll;

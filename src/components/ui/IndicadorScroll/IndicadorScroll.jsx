import React from "react";
import { FiChevronDown } from "react-icons/fi";
import { useHayMasContenido } from "../../../hooks/useHayMasContenido";
import styles from "./IndicadorScroll.module.css";

// Aviso de "hay más contenido abajo" para contenedores scrolleables (pedido
// de clientes: en Rango 2 no se daban cuenta de que tenían que scrollear).
// Va como ÚLTIMO hijo del contenedor que scrollea: es un ancla sticky de
// alto 0 pegada al borde inferior visible, así que no ocupa lugar ni tapa
// el final del contenido una vez que se llega abajo (ahí se oculta).
// Suma un degradé que "corta" el contenido y una píldora que baja al tocarla.
//
// `compacto`: solo el ícono, para columnas angostas (listas laterales).
// `soloEscritorio`: oculto debajo de 64rem, donde el scroll de la página es
// el gesto natural del celular.
export function IndicadorScroll({ contenedorRef, compacto = false, soloEscritorio = false }) {
  const hayMas = useHayMasContenido(contenedorRef);

  const bajar = () => {
    const el = contenedorRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.round(el.clientHeight * 0.7), behavior: "smooth" });
  };

  return (
    <div
      className={`${styles.ancla} ${hayMas ? styles.visible : ""} ${soloEscritorio ? styles.soloEscritorio : ""}`}
      aria-hidden={!hayMas}
    >
      <span className={styles.degrade} />
      <button
        type="button"
        className={`${styles.pildora} ${compacto ? styles.pildoraCompacta : ""}`}
        onClick={bajar}
        tabIndex={hayMas ? 0 : -1}
        aria-label="Ver más contenido abajo"
      >
        {!compacto && <span>Más abajo</span>}
        <FiChevronDown className={styles.flecha} aria-hidden="true" />
      </button>
    </div>
  );
}

export default IndicadorScroll;

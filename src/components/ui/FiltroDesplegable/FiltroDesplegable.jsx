import React, { useEffect, useId, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import styles from "./FiltroDesplegable.module.css";

// Filtro compacto de listados admin: "Etiqueta: Valor ▾". Se resalta cuando
// el valor elegido no es el de por defecto (valorPorDefecto).
export const FiltroDesplegable = ({ etiqueta, valor, opciones = [], onChange, valorPorDefecto }) => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const idLista = useId();
  const seleccionada = opciones.find((o) => String(o.value) === String(valor)) || opciones[0];
  const activo = valorPorDefecto !== undefined && String(valor) !== String(valorPorDefecto);

  useEffect(() => {
    if (!abierto) return undefined;
    const alClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    const alTeclear = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alClickFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alClickFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <button
        type="button"
        className={`${styles.disparador} ${activo ? styles.activo : ""} ${abierto ? styles.abierto : ""}`}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
      >
        <span className={styles.etiqueta}>{etiqueta}:</span>
        <span className={styles.valor}>{seleccionada?.label}</span>
        <FiChevronDown className={styles.chevron} aria-hidden="true" />
      </button>
      {abierto && (
        <ul className={styles.lista} role="listbox" id={idLista} aria-label={etiqueta}>
          {opciones.map((o) => {
            const elegida = String(o.value) === String(valor);
            return (
              <li key={o.value} role="option" aria-selected={elegida}>
                <button
                  type="button"
                  className={`${styles.opcion} ${elegida ? styles.opcionElegida : ""}`}
                  onClick={() => {
                    onChange(o.value);
                    setAbierto(false);
                  }}
                >
                  <span>{o.label}</span>
                  {elegida && <FiCheck aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

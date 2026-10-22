import React, { useState } from "react";
import { FiCreditCard, FiSearch } from "react-icons/fi";
import styles from "./Paso3Simulador.module.css";

// A partir de cuántas líneas se pasa de tarjetas a lista con buscador: con
// más de 4 las tarjetas ocupan demasiado alto (sobre todo en Rango 2 y en
// mobile) y elegir se vuelve más fácil buscando por nombre.
const MAX_TARJETAS = 4;

const formatearMaximo = (monto) =>
  monto > 0 ? `Hasta $ ${new Intl.NumberFormat("es-AR").format(monto)}` : "";

// Selector de línea (TipoLimiteCadenaValor) para el alta de operación. Se
// adapta a cuántas líneas tenga activas la cadena: una sola se muestra fija
// (no hay nada que elegir), hasta MAX_TARJETAS como tarjetas, y más que eso
// como lista compacta con búsqueda y scroll propio.
export default function SelectorLinea({
  opciones = [],
  value,
  onChange,
  error,
  disabled = false,
  labelledBy,
}) {
  const [busqueda, setBusqueda] = useState("");

  if (opciones.length === 0) {
    return (
      <p className={styles.lineasVacio}>
        No hay líneas disponibles en esta moneda.
      </p>
    );
  }

  if (opciones.length === 1) {
    const unica = opciones[0];
    return (
      <div className={`${styles.lineaUnica} ${error ? styles.lineaError : ""}`}>
        <span className={styles.lineaIcono} aria-hidden="true">
          <FiCreditCard />
        </span>
        <span className={styles.lineaTexto}>
          <strong>{unica.label}</strong>
          <span>
            Es la línea disponible para tu empresa
            {unica.montoMaximo > 0 ? ` · ${formatearMaximo(unica.montoMaximo)}` : ""}
          </span>
        </span>
      </div>
    );
  }

  if (opciones.length <= MAX_TARJETAS) {
    return (
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className={styles.lineasTarjetas}
      >
        {opciones.map((op) => {
          const seleccionada = String(op.value) === String(value);
          return (
            <button
              key={op.value}
              type="button"
              role="radio"
              aria-checked={seleccionada}
              disabled={disabled}
              onClick={() => onChange(op.value)}
              className={`${styles.lineaTarjeta} ${seleccionada ? styles.lineaSeleccionada : ""}`}
            >
              <span className={styles.lineaIcono} aria-hidden="true">
                <FiCreditCard />
              </span>
              <span className={styles.lineaTexto}>
                <strong>{op.label}</strong>
                {op.montoMaximo > 0 && <span>{formatearMaximo(op.montoMaximo)}</span>}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const termino = busqueda.trim().toLowerCase();
  const visibles = termino
    ? opciones.filter((op) => op.label.toLowerCase().includes(termino))
    : opciones;

  return (
    <div className={styles.lineasLista}>
      <div className={styles.lineasBuscador}>
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar entre tus líneas"
          aria-label="Buscar línea"
          disabled={disabled}
        />
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className={styles.lineasListaScroll}
      >
        {visibles.map((op) => {
          const seleccionada = String(op.value) === String(value);
          return (
            <button
              key={op.value}
              type="button"
              role="radio"
              aria-checked={seleccionada}
              disabled={disabled}
              onClick={() => onChange(op.value)}
              className={`${styles.lineaFila} ${seleccionada ? styles.lineaFilaSeleccionada : ""}`}
            >
              <span className={styles.lineaRadio} aria-hidden="true" />
              <strong>{op.label}</strong>
              {op.montoMaximo > 0 && <span>{formatearMaximo(op.montoMaximo)}</span>}
            </button>
          );
        })}
        {visibles.length === 0 && (
          <p className={styles.lineasVacio}>
            No hay líneas que coincidan con la búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}

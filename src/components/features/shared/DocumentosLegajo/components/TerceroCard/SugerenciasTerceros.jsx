import React from "react";
import s from "./TerceroCard.module.css";
import { inicialesDe } from "./terceroCardUtils";

// Atajo del modal de alta: reutilizar a alguien que ya está cargado en otra
// pestaña del legajo en vez de volver a tipear su CUIT. "Usar" dispara la
// misma búsqueda por CUIT que el campo de arriba (vinculación, padrón y CDA
// incluidos), así que no hay un camino distinto para estos casos.
export function SugerenciasTerceros({ sugerencias = [], onUsar, disabled = false, isAdmin = false }) {
  if (sugerencias.length === 0) return null;

  return (
    <div className={s.sugerencias}>
      <span className={s.sugerenciasTitulo}>O elegí a alguien que ya está en tu legajo</span>
      <ul className={s.sugerenciasLista}>
        {sugerencias.map((p) => (
          <li key={p.cuit} className={s.sugerencia}>
            <span className={s.avatar} aria-hidden="true">
              {inicialesDe(p.nombre)}
            </span>
            <span className={s.sugerenciaTexto}>
              <strong>{p.nombre || "Sin nombre"}</strong>
              <span>
                {p.roles.join(" · ")} · CUIT {p.cuit}
              </span>
            </span>
            <button
              type="button"
              className={`${s.sugerenciaUsar} ${isAdmin ? s.sugerenciaUsarAdmin : ""}`}
              onClick={() => onUsar(p)}
              disabled={disabled}
              aria-label={`Usar a ${p.nombre || p.cuit}`}
            >
              Usar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

import React from "react";
import styles from "./Skeleton.module.css";

// Primitiva única de carga tipo skeleton para toda la app (canónica en la
// zona admin). Regla de uso: el contenido que se está cargando se dibuja
// como bloques que calcan su forma real, dentro del chrome real de la
// pantalla (header/filtros/tabla visibles al instante). El Spinner queda
// reservado para feedback de acciones en curso (guardar, toggles, botones),
// nunca para la carga inicial de listas o paneles.
//
// radius: valor CSS, o "pill" (999px) para badges/switches.
export function Skeleton({ width, height, radius, style, className = "" }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height,
        borderRadius: radius === "pill" ? "999px" : radius,
        ...style,
      }}
    />
  );
}

import React from "react";
import { numeroALetras } from "../../../utils/numeroALetras";
import styles from "./MontoEnPalabras.module.css";

// Chip chico con el monto cargado en palabras (ej: "Dos millones"), pensado
// para ir pegado justo debajo de un InputSimple con máscara de dinero. No
// reemplaza ninguna validación: si el valor no se puede convertir (vacío,
// cero, fuera de rango) no renderiza nada.
export const MontoEnPalabras = ({ value, pullUp = false, style }) => {
  const texto = numeroALetras(value);
  if (!texto) return null;

  return (
    <span className={`${styles.badge} ${pullUp ? styles.pullUp : ""}`} style={style}>
      {texto}
    </span>
  );
};

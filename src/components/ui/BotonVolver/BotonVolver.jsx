import React from "react";
import { FaAngleLeft } from "react-icons/fa";
import styles from "./BotonVolver.module.css";

export const BotonVolver = ({ 
  onClick, 
  texto = "Volver al paso anterior",
  icon: Icon = FaAngleLeft
}) => {
  return (
    <div className={styles.contenedorBoton}>
      <button type="button" onClick={onClick} className={styles.btnVolver}>
        <Icon size={16} /> {texto}
      </button>
    </div>
  );
};
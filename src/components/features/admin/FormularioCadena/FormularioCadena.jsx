import React from "react";
import { FiCheck, FiUploadCloud } from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import styles from "./FormularioCadena.module.css";

export function SeccionCadena({ icono, titulo, children }) {
  return (
    <section className={styles.seccion}>
      <h4 className={styles.seccionTitulo}>
        {icono}
        <span>{titulo}</span>
        <span className={styles.seccionLinea} aria-hidden="true" />
      </h4>
      {children}
    </section>
  );
}

export function PasosActivacion({ paso }) {
  const pasos = ["Elegir cadena", "Datos de la cadena"];
  return (
    <ol className={styles.pasos}>
      {pasos.map((texto, i) => {
        const numero = i + 1;
        const estado = numero < paso ? styles.pasoHecho : numero === paso ? styles.pasoActual : "";
        return (
          <li key={texto} className={`${styles.paso} ${estado}`}>
            <span className={styles.pasoNumero}>{numero < paso ? <FiCheck /> : numero}</span>
            {texto}
          </li>
        );
      })}
    </ol>
  );
}

export function CargaLogoCadena({ logoSrc, onElegir, onQuitar }) {
  return (
    <div className={styles.logo}>
      <span className={styles.logoVista} aria-hidden="true">
        {logoSrc ? <img src={logoSrc} alt="" /> : <FiUploadCloud />}
      </span>
      <span className={styles.logoTextos}>
        <strong>
          Logo de la cadena <span>(opcional)</span>
        </strong>
        <span>JPG o PNG con fondo transparente, hasta 500 KB.</span>
      </span>
      {logoSrc ? (
        <Button type="button" variant="adminNeutro" size="sm" onClick={onQuitar}>
          Quitar
        </Button>
      ) : (
        <Button type="button" variant="adminSuave" size="sm" onClick={onElegir}>
          Elegir imagen
        </Button>
      )}
    </div>
  );
}

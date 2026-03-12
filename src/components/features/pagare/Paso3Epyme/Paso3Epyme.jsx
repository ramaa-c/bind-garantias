import React from "react";
import { useFormContext } from "react-hook-form";
import { FaFileArrowDown, FaLink, FaLock } from "react-icons/fa6";
import { Input, Button } from "../../../ui";
import styles from "./Paso3Epyme.module.css";

export default function Paso3Epyme() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={styles.container}>
      <h3 className={styles.subtitle}>
        <FaLock className={styles.subtitleIcon} />
        Generación y Vinculación de Pagaré
      </h3>

      <div className={styles.cardsContainer}>
        <a
          href="https://epyme.cajadevalores.com.ar/login"
          target="_blank"
          rel="noreferrer"
          className={styles.card}
        >
          <div className={styles.cardIcon}>
            <FaLink />
          </div>
          <p className={styles.cardText}>
            Primero generá el pagaré desde la plataforma oficial de Caja de
            Valores.
          </p>
          <Button variant="outline" type="button" className={styles.borderless}>
            IR A ePYME
          </Button>
        </a>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <FaFileArrowDown />
          </div>
          <p className={styles.cardText}>
            ¿Dudas con la plataforma? Guiate paso a paso con este instructivo
            detallado.
          </p>
          <Button variant="outline" type="button" className={styles.borderless}>
            VER INSTRUCTIVO
          </Button>
        </div>
      </div>

      <div className={styles.inputSection}>
        <Input
          label="ID de Operación ePYME *"
          placeholder="EJ: 1234789558666"
          error={errors.idEpyme?.message}
          {...register("idEpyme")}
        />
        <p className={styles.helperText}>
          Ingresá el número identificatorio generado para finalizar la
          solicitud.
        </p>
      </div>

      <div className={styles.textareaWrapper}>
        <Input
          label="¿Tenés algún mensaje o aclaración para el equipo? (Opcional)"
          as="textarea"
          className={styles.textarea}
          placeholder="Escribí acá tus comentarios..."
          {...register("mensaje")}
        />
      </div>

      <div className={styles.footer}>
        <p className={styles.disclaimer}>
          * Sujeto a confirmación en la recepción de documentación física y a
          cambios en el score.
        </p>
        <Button type="submit" variant="primary" className={styles.btnFinalizar}>
          FINALIZAR SOLICITUD
        </Button>
      </div>
    </div>
  );
}

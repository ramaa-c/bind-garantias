import React from "react";
import { useFormContext } from "react-hook-form";
import { FaExternalLinkAlt, FaFilePdf, FaLock } from "react-icons/fa";
import { InputFlotante, Button } from "../../../ui";
import styles from "./Paso3Epyme.module.css";

export default function Paso3Epyme() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const idEpymeValue = watch("idEpyme") || "";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.iconLockWrapper}>
          <FaLock />
        </div>
        <h3 className={styles.title}>Vinculación de Pagaré ePYME</h3>
        <p className={styles.description}>
          Para finalizar, necesitamos vincular el pagaré generado en la plataforma oficial.
        </p>
      </header>

      <div className={styles.cardsGrid}>
        <a
          href="https://epyme.cajadevalores.com.ar/login"
          target="_blank"
          rel="noreferrer"
          className={styles.cardPrimary}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardIcon}>
              <FaExternalLinkAlt />
            </div>
            <div>
              <h4 className={styles.cardTitle}>Plataforma ePYME</h4>
              <p className={styles.cardText}>Generá el pagaré en Caja de Valores.</p>
            </div>
          </div>
          <span className={styles.linkAction}>IR AL SITIO</span>
        </a>

        <div className={styles.cardSecondary}>
          <FaFilePdf className={styles.pdfIcon} />
          <p className={styles.cardText}>¿Necesitás ayuda? <br /><strong>Ver instructivo</strong></p>
        </div>
      </div>

      <div className={styles.formSection}>
        <p className={styles.helperText}>
          El número identificatorio que figura en tu comprobante de ePYME.
        </p>
        <div className={styles.inputGroup}>
          <InputFlotante
            label="ID de Operación ePYME"
            error={errors.idEpyme?.message}
            maxLength={20}
            esValido={idEpymeValue.length >= 10}
            {...register("idEpyme", {
              onChange: (e) => {
                const onlyNums = e.target.value.replace(/\D/g, "");
                setValue("idEpyme", onlyNums);
              }
            })}
          />


        </div>

        <div className={styles.textareaGroup}>
          <InputFlotante
            label="Mensaje o aclaración (Opcional)"
            as="textarea"
            className={styles.customTextarea}
            {...register("mensaje")}
          />
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.disclaimerBox}>
          <p className={styles.disclaimerText}>
            * Sujeto a revisión de documentación y score crediticio.
          </p>
        </div>
        <Button type="submit" variant="primary" size="lg" className={styles.btnFinal}>
          FINALIZAR SOLICITUD
        </Button>
      </footer>
    </div>
  );
}
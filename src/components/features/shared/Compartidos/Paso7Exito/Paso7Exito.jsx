import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FiCheckCircle,
  FiDownload,
  FiEdit3,
  FiFileText,
} from "react-icons/fi";
import { Button, Alert, BotonVolver } from "../../../../ui";
import styles from "./Paso7Exito.module.css";

export default function Paso7Exito({ onVolverInicio }) {
  const handleFinalizar = () => {
    onVolverInicio();
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroGlow}></div>
        <div className={styles.heroContent}>
          <FiCheckCircle className={styles.heroIcon} />
          <div className={styles.heroText}>
            <span className={styles.heroSubtitle}>
              Solicitud N°384 por $3.000.000
            </span>
            <h1 className={styles.heroTitle}>
              ¡Felicitaciones!
              <br />
              Tu solicitud está pre-aprobada
            </h1>
          </div>
        </div>
      </div>

      <h3 className={styles.subtitle}>Te contamos los pasos a seguir:</h3>

      <div className={styles.stepsContainer}>
        <div className={styles.stepCard}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Descargá y enviá la instrucción</h4>
            <p className={styles.stepText}>
              Descargá este documento, firmalo y envialo escaneado vía mail a{" "}
              <a
                href="mailto:comerciales@bindgarantias.com.ar"
                className={styles.textHighlight}
              >
                comerciales@bindgarantias.com.ar
              </a>
              . <br />
              <span className={styles.textMuted}>
                ¡Es firma simple, no hace falta certificar!
              </span>
            </p>

            <div className={styles.downloadBox}>
              <div className={styles.downloadInfo}>
                <FiFileText className={styles.downloadIcon} />
                <span>Nota de instrucción permanente.pdf</span>
              </div>
              <Button type="button" variant="outline" size="sm">
                <FiDownload className={styles.iconMarginRight} /> DESCARGAR
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.stepCard}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Firmá electrónicamente el Contrato y Fianza</h4>
            <p className={styles.stepText}>
              Una vez validada la documentación ingresada, recibirán por mail la
              solicitud de firma de la{" "}
              <strong>Oferta del Contrato de Garantía Recíproca</strong> para
              realizarla en forma electrónica.
            </p>

            <div className={styles.mtSmall}>
              <Alert variant="default" layout="pill" icon={FiEdit3}>
                La firma se valida a través de AFIP. Necesitarán clave fiscal
                Nivel 2 o superior.
              </Alert>
            </div>

            <p className={`${styles.stepText} ${styles.mtSmall}`}>
              Una vez registradas todas las firmas, vamos a habilitarles la
              línea en nuestros sistemas para que puedan comenzar a operar.
            </p>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.actionsLeft}>
        <BotonVolver
          texto="VOLVER A LA LISTA DE SOLICITUDES"
          onClick={handleFinalizar}
        />
      </div>
    </div>
  );
}
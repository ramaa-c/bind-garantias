import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiCheckCircle,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiInfo,
} from "react-icons/fi";
import { Button, Alert, BotonVolver } from "../../../../ui";
import styles from "./PasoExito.module.css";

export default function PasoExito({ onVolverInicio }) {
  const { reset, control } = useFormContext();
  const tipoCheque = useWatch({ control, name: "tipoCheque" });

  const handleFinalizar = () => {
    reset();
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
              Operación N°402 por $3.000.000
            </span>
            <h1 className={styles.heroTitle}>
              ¡Felicitaciones!
              <br />
              El cheque ha sido ingresado
            </h1>
          </div>
        </div>
      </div>

      <h3 className={styles.subtitle}>Te contamos los pasos a seguir:</h3>

      <div className={styles.stepsContainer}>
        {tipoCheque === "fisico" ? (
          <>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Descargá la Nota de Remisión</h4>
                <p className={styles.stepText}>
                  Descargá este documento, firmalo y adjuntalo junto con el cheque
                  físico para enviarlo por correo postal o entregarlo en nuestras oficinas.
                </p>
                <div className={styles.downloadBox}>
                  <div className={styles.downloadInfo}>
                    <FiFileText className={styles.downloadIcon} />
                    <span>Nota de Remisión.pdf</span>
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
                <h4 className={styles.stepTitle}>Endosá y enviá el cheque</h4>
                <p className={styles.stepText}>
                  Asegurate de endosar correctamente el cheque a nombre de
                  BIND Garantías antes de enviarlo.
                </p>
                <div className={styles.mtSmall}>
                  <Button type="button" variant="link" size="sm" style={{ padding: 0 }}>
                    <FiInfo className={styles.iconMarginRight} /> Ver instructivo de endoso
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Aceptá el eCheck en tu Home Banking</h4>
                <p className={styles.stepText}>
                  Ingresá a tu plataforma bancaria y aceptá el eCheck
                  correspondiente al ID Coelsa ingresado.
                </p>
              </div>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Endosá a BIND Garantías a través de Epyme</h4>
                <p className={styles.stepText}>
                  Dirigite a la plataforma Epyme Caja de Valores para realizar el endoso
                  del eCheck a favor de BIND Garantías.
                </p>
                <div className={styles.mtSmall}>
                  <Alert variant="default" layout="pill" icon={FiExternalLink}>
                    Asegurate de tener tu usuario Epyme activo y vinculado.
                  </Alert>
                </div>
                <div className={styles.epymeBtnWrapper}>
                  <Button type="button" variant="outline" size="sm">
                    IR A EPYME <FiExternalLink className={styles.iconMarginLeft} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
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
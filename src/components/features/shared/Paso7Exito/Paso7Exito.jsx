import React from "react";
import {
  FiCheckCircle,
  FiDownload,
  FiEdit3,
  FiFileText,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { Alert } from "../../../ui/Alert/Alert";
import { BotonVolver } from "../../../ui/BotonVolver/BotonVolver";
import styles from "./Paso7Exito.module.css";

export default function Paso7Exito({ onVolverInicio }) {
  const handleFinalizar = () => {
    onVolverInicio();
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroGlow}></div>
        <div className={styles.heroIconWrap}>
          <FiCheckCircle className={styles.heroIcon} />
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            ¡Felicitaciones! Tu solicitud está pre-aprobada
          </h1>
          <p className={styles.heroSubtitle}>
            Restan estos <strong>2 pasos</strong> para activar tu línea de
            crédito.
          </p>
        </div>
      </div>

      <div className={styles.stepsGrid}>
        <div className={styles.stepCard}>
          <div className={styles.stepHead}>
            <span className={styles.stepNumber}>1</span>
            <h4 className={styles.stepTitle}>
              Descargá y enviá la instrucción
            </h4>
          </div>
          <p className={styles.stepText}>
            Descargá este documento, firmalo y envialo escaneado vía mail a{" "}
            <a
              href="mailto:comerciales@bindgarantias.com.ar"
              className={styles.textHighlight}
            >
              comerciales@bindgarantias.com.ar
            </a>
            .{" "}
            <span className={styles.textMuted}>
              Es firma simple, no hace falta certificar.
            </span>
          </p>

          <div className={styles.downloadBox}>
            <div className={styles.downloadInfo}>
              <FiFileText className={styles.downloadIcon} />
              <span>Nota de instrucción permanente.pdf</span>
            </div>
            <Button type="button" variant="outline" size="sm">
              <FiDownload className={styles.iconMarginRight} /> Descargar
            </Button>
          </div>
        </div>

        <div className={styles.stepCard}>
          <div className={styles.stepHead}>
            <span className={styles.stepNumber}>2</span>
            <h4 className={styles.stepTitle}>
              Firmá el Contrato y Fianza
            </h4>
          </div>
          <p className={styles.stepText}>
            Una vez validada la documentación, van a recibir por mail la
            solicitud de firma electrónica de la{" "}
            <strong>Oferta del Contrato de Garantía Recíproca</strong>. Al
            completarse todas las firmas, habilitamos la línea en nuestros
            sistemas.
          </p>

          <Alert variant="default" layout="pill" icon={FiEdit3}>
            Se valida con clave fiscal AFIP Nivel 2 o superior.
          </Alert>
        </div>
      </div>

      <div className={styles.footer}>
        <BotonVolver
          texto="VOLVER A LA LISTA DE SOLICITUDES"
          onClick={handleFinalizar}
        />
      </div>
    </div>
  );
}

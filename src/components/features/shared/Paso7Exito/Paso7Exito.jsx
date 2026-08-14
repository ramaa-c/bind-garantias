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

const SIMBOLOS_MONEDA = {
  2: "U$D",
  10: "UVAS",
  500: "€",
  5000: "$",
};

const formatearPlazo = (plazo) => {
  if (!plazo) return null;
  const fecha = new Date(plazo);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function Paso7Exito({ onVolverInicio, resumen }) {
  const handleFinalizar = () => {
    onVolverInicio();
  };

  const montoFormateado =
    resumen && Number.isFinite(resumen.monto)
      ? `${SIMBOLOS_MONEDA[resumen.monedaId] || "$"} ${resumen.monto.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;
  const plazoFormateado = resumen ? formatearPlazo(resumen.plazo) : null;

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

      {resumen && (
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Resumen de tu solicitud</span>
          <div className={styles.summaryGrid}>
            {resumen.linea && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryItemLabel}>Línea</span>
                <span className={styles.summaryItemValue}>
                  {resumen.linea}
                </span>
              </div>
            )}
            {montoFormateado && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryItemLabel}>
                  Monto solicitado
                </span>
                <span className={styles.summaryItemValue}>
                  {montoFormateado}
                </span>
              </div>
            )}
            {plazoFormateado && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryItemLabel}>Plazo</span>
                <span className={styles.summaryItemValue}>
                  {plazoFormateado}
                </span>
              </div>
            )}
            {!!resumen.id && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryItemLabel}>N° de solicitud</span>
                <span className={styles.summaryItemValue}>#{resumen.id}</span>
              </div>
            )}
          </div>
        </div>
      )}

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

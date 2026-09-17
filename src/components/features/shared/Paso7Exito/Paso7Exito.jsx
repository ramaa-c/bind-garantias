import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { Alert } from "../../../ui/Alert/Alert";
import { BotonVolver } from "../../../ui/BotonVolver/BotonVolver";
import { useChannel } from "../../../../context/ChannelContext";
import { useAccesoDashboardCliente } from "../../../../hooks/useAccesoDashboardCliente";
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
  const navigate = useNavigate();
  const { basePath } = useChannel();
  // Crear la solicitud (para llegar hasta acá) ya cuenta como "solicitud
  // activa" del lado de useAccesoDashboardCliente, así que Legajo debería
  // estar desbloqueado en este mismo momento - el chequeo es solo defensivo
  // (no mostrar una acción que todavía llevaría a un candado).
  const { legajoDesbloqueado } = useAccesoDashboardCliente();

  const handleFinalizar = () => {
    onVolverInicio();
  };

  const handleIrALegajo = () => {
    navigate(`${basePath}/legajo`);
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

      {/* Los 2 pasos de abajo dependen de BIND (firma, validación) y pueden
          tardar días - separado de eso, hay algo que el usuario SÍ puede
          hacer ahora mismo, adentro de la app: completar su Legajo. Antes
          esta pantalla terminaba directo en los pasos externos, sin decirle
          a dónde ir mientras tanto (Legajo/Documentación recién se
          desbloquearon con esta misma solicitud) - quedaba a la deriva
          hasta encontrar el candado abierto por su cuenta en el sidebar. */}
      {legajoDesbloqueado && (
        <div className={styles.legajoCta}>
          <div className={styles.legajoCtaIconWrap}>
            <FiUsers className={styles.legajoCtaIcon} />
          </div>
          <div className={styles.legajoCtaText}>
            <h4 className={styles.legajoCtaTitle}>
              Mientras tanto, completá tu Legajo
            </h4>
            <p className={styles.legajoCtaSubtitle}>
              No hace falta esperar a que se active la línea: ya podés cargar
              los datos de tu empresa y de las personas vinculadas.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleIrALegajo}
            className={styles.legajoCtaBtn}
            iconRight={<FiArrowRight size={14} />}
          >
            Ir al Legajo
          </Button>
        </div>
      )}

      <span className={styles.stepsGridLabel}>Para activar tu línea</span>
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
            Se valida con clave fiscal ARCA Nivel 2 o superior.
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

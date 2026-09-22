import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiCheck,
  FiArrowRight,
  FiLock,
  FiZap,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { BotonVolver } from "../../../ui/BotonVolver/BotonVolver";
import { useChannel } from "../../../../context/useChannel";
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
  const { legajoDesbloqueado, documentacionDesbloqueada } =
    useAccesoDashboardCliente();

  const handleFinalizar = () => {
    onVolverInicio();
  };

  const handleIrALegajo = () => {
    navigate(`${basePath}/legajo`);
  };

  const handleIrADocumentacion = () => {
    navigate(`${basePath}/documentacion`);
  };

  // documentacionDesbloqueada ya implica Legajo 100% completo (ver
  // useAccesoDashboardCliente) - se reusa esa misma derivación en vez de
  // pedir faltanLegajo de nuevo, así el nodo 1 del timeline pasa a "hecho"
  // apenas deja de ser el paso pendiente real.
  const legajoCompleto = documentacionDesbloqueada;

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
          <div className={styles.summaryHead}>
            <span className={styles.summaryLabel}>Resumen de tu solicitud</span>
            {!!resumen.id && (
              <span className={styles.summaryIdTag}>N° {resumen.id}</span>
            )}
          </div>

          {montoFormateado && (
            <div className={styles.summaryAmountBlock}>
              <span className={styles.summaryAmountLabel}>
                Monto solicitado
              </span>
              <span className={styles.summaryAmountValue}>
                {montoFormateado}
              </span>
            </div>
          )}

          {(resumen.linea || plazoFormateado) && (
            <div className={styles.summaryFootRow}>
              {resumen.linea && (
                <div className={styles.summaryFootItem}>
                  <span className={styles.summaryFootLabel}>Línea</span>
                  <span className={styles.summaryFootValue}>
                    {resumen.linea}
                  </span>
                </div>
              )}
              {plazoFormateado && (
                <div className={styles.summaryFootItem}>
                  <span className={styles.summaryFootLabel}>
                    Plazo estimado
                  </span>
                  <span className={styles.summaryFootValue}>
                    {plazoFormateado}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estos pasos son de la plataforma actual, no la anterior: ya no hay
          que descargar/firmar/enviar por mail una nota de instrucción ni
          esperar una firma electrónica externa del contrato - lo que activa
          la línea hoy es completar el Legajo y cargar la Documentación,
          ambos acá mismo (reemplazado el 2026-09-17, quedaban del flujo
          viejo). El tercer nodo (Línea activa) no es un paso propio: es el
          destino, para que la secuencia cierre con el objetivo en vez de
          terminar en el paso 2 sin mostrar a dónde lleva todo esto. */}
      <span className={styles.stepsGridLabel}>Para activar tu línea</span>
      <div className={styles.timeline}>
        <div className={styles.timelineItem}>
          <div className={styles.timelineRail}>
            <span
              className={`${styles.timelineDot} ${legajoCompleto ? styles.dotDone : styles.dotActive}`}
            >
              {legajoCompleto ? <FiCheck size={14} /> : "1"}
            </span>
            <span
              className={`${styles.timelineLine} ${legajoCompleto ? styles.lineDone : ""}`}
            />
          </div>
          <div className={styles.timelineContent}>
            <h4 className={styles.timelineTitle}>Completá tu Legajo</h4>
            {legajoCompleto ? (
              <p className={styles.timelineText}>
                Datos de tu empresa completos.
              </p>
            ) : (
              <>
                <p className={styles.timelineText}>
                  Cargá los datos de tu empresa y de las personas vinculadas
                  a ella. No hace falta esperar: ya podés hacerlo.
                </p>
                {legajoDesbloqueado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleIrALegajo}
                    className={styles.timelineBtn}
                    iconRight={<FiArrowRight size={14} />}
                  >
                    Ir al Legajo
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className={styles.timelineItem}>
          <div className={styles.timelineRail}>
            <span
              className={`${styles.timelineDot} ${documentacionDesbloqueada ? styles.dotActive : styles.dotLocked}`}
            >
              {documentacionDesbloqueada ? "2" : <FiLock size={12} />}
            </span>
            <span className={styles.timelineLine} />
          </div>
          <div className={styles.timelineContent}>
            <h4 className={styles.timelineTitle}>Cargá la Documentación</h4>
            {documentacionDesbloqueada ? (
              <>
                <p className={styles.timelineText}>
                  Subí la documentación requerida de tu empresa.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleIrADocumentacion}
                  className={styles.timelineBtn}
                  iconRight={<FiArrowRight size={14} />}
                >
                  Ir a Documentación
                </Button>
              </>
            ) : (
              <p className={styles.timelineText}>
                Se habilita cuando completes el Legajo al 100%.
              </p>
            )}
          </div>
        </div>

        <div className={styles.timelineItem}>
          <div className={styles.timelineRail}>
            <span className={styles.timelineDot}>
              <FiZap size={13} />
            </span>
          </div>
          <div className={styles.timelineContent}>
            <h4 className={styles.timelineTitle}>Línea activa</h4>
            <p className={styles.timelineText}>
              Te avisamos apenas quede todo listo para operar.
            </p>
          </div>
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

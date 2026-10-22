import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiChevronLeft,
  FiArrowRight,
  FiLock,
  FiZap,
  FiFileText,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { useChannel } from "../../../../context/useChannel";
import { useAccesoDashboardCliente } from "../../../../hooks/useAccesoDashboardCliente";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import styles from "./Paso7Exito.module.css";

const SIMBOLOS_MONEDA = {
  2: "U$D",
  10: "UVAS",
  500: "€",
  5000: "$",
};

const NOMBRES_MONEDA = {
  2: "Dólares",
  5000: "Pesos",
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

export default function Paso7Exito({
  onVolverInicio,
  onNuevaSolicitud,
  resumen,
}) {
  const navigate = useNavigate();
  const { basePath } = useChannel();
  // Crear la solicitud (para llegar hasta acá) ya cuenta como "solicitud
  // activa" del lado de useAccesoDashboardCliente, así que Legajo debería
  // estar desbloqueado en este mismo momento - el chequeo es solo defensivo
  // (no mostrar una acción que todavía llevaría a un candado).
  const { legajoDesbloqueado, documentacionDesbloqueada } =
    useAccesoDashboardCliente();

  // Con el legajo completo, el paso 2 solo esta pendiente si todavia faltan documentos obligatorios
  const { faltanDocumentos, isLoading: cargandoDocumentos } = useValidacionLegajo();

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
  const documentacionCompleta = documentacionDesbloqueada && !cargandoDocumentos && !faltanDocumentos;

  const montoFormateado =
    resumen && Number.isFinite(resumen.monto)
      ? `${SIMBOLOS_MONEDA[resumen.monedaId] || "$"} ${resumen.monto.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;
  const plazoFormateado = resumen ? formatearPlazo(resumen.plazo) : null;
  const rechazada = !!resumen?.rechazada;

  // Acción principal según dónde quedó el socio: el próximo paso pendiente
  // que ya esté habilitado. Si no queda ninguno, solo se ofrece volver.
  const accionPrincipal = !legajoCompleto
    ? legajoDesbloqueado
      ? { texto: "Ir al Legajo", onClick: handleIrALegajo }
      : null
    : documentacionDesbloqueada && !documentacionCompleta
      ? { texto: "Ir a Documentación", onClick: handleIrADocumentacion }
      : null;

  const pasos = [
    {
      titulo: "Completá tu Legajo",
      texto: legajoCompleto
        ? "Datos de tu empresa completos."
        : "Datos de la empresa y personas vinculadas. Ya podés hacerlo.",
      estado: legajoCompleto ? "hecho" : "activo",
    },
    {
      titulo: "Cargá la Documentación",
      texto: documentacionCompleta
        ? "Documentación completa."
        : documentacionDesbloqueada
          ? "Subí la documentación requerida de tu empresa."
          : "Se habilita al completar el Legajo al 100%.",
      estado: documentacionCompleta
        ? "hecho"
        : documentacionDesbloqueada
          ? "activo"
          : "bloqueado",
    },
    {
      titulo: "Línea activa",
      texto: "Te avisamos apenas quede lista para operar.",
      estado: "meta",
    },
  ];

  return (
    <div className={styles.container}>
      <article className={styles.card} aria-labelledby="exito-titulo">
        {/* ── ESTADO ── */}
        <div className={`${styles.bloque} ${styles.head}`}>
          <span
            className={`${styles.estadoIcono} ${rechazada ? styles.estadoIconoNeutro : ""}`}
            aria-hidden="true"
          >
            {rechazada ? <FiFileText /> : <FiCheck />}
          </span>
          <div className={styles.headTexto}>
            <div className={styles.chips}>
              <span
                className={`${styles.chip} ${rechazada ? styles.chipRechazada : styles.chipOk}`}
              >
                {rechazada ? "No aprobada" : "Pre-aprobada"}
              </span>
              {!!resumen?.id && (
                <span className={styles.chip}>Solicitud N° {resumen.id}</span>
              )}
            </div>
            <h1 id="exito-titulo" className={styles.titulo}>
              {rechazada
                ? "Tu solicitud fue registrada"
                : "¡Felicitaciones! Tu solicitud está pre-aprobada"}
            </h1>
            <p className={styles.subtitulo}>
              {rechazada
                ? "No superó la evaluación automática de la línea. Podés realizar una nueva solicitud cuando quieras."
                : "Restan 2 pasos para activar tu línea de crédito."}
            </p>
          </div>
        </div>

        {/* ── RESUMEN ── */}
        {resumen && (montoFormateado || resumen.linea || plazoFormateado) && (
          <dl className={`${styles.bloque} ${styles.resumen}`}>
            {montoFormateado && (
              <div className={`${styles.resumenItem} ${styles.resumenMonto}`}>
                <dt>Monto solicitado</dt>
                <dd>{montoFormateado}</dd>
              </div>
            )}
            {resumen.linea && (
              <div className={styles.resumenItem}>
                <dt>Línea</dt>
                <dd>{resumen.linea}</dd>
              </div>
            )}
            {NOMBRES_MONEDA[resumen.monedaId] && (
              <div className={styles.resumenItem}>
                <dt>Moneda</dt>
                <dd>{NOMBRES_MONEDA[resumen.monedaId]}</dd>
              </div>
            )}
            {plazoFormateado && (
              <div className={styles.resumenItem}>
                <dt>Plazo estimado</dt>
                <dd>{plazoFormateado}</dd>
              </div>
            )}
          </dl>
        )}

        {/* ── PRÓXIMOS PASOS / MOTIVO ── */}
        {rechazada ? (
          <div className={styles.bloque}>
            <div className={styles.motivo}>
              <FiAlertCircle className={styles.motivoIcono} aria-hidden="true" />
              <div className={styles.motivoTexto}>
                <span>Motivo</span>
                <p>
                  {resumen?.motivoRechazo ||
                    "No cumple los criterios de aprobación automática de esta línea."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <section
            className={`${styles.bloque} ${styles.pasosBloque}`}
            aria-labelledby="exito-pasos"
          >
            <h2 id="exito-pasos" className={styles.pasosTitulo}>
              Para activar tu línea
            </h2>
            <ol className={styles.pasos}>
              {pasos.map((paso, i) => (
                <li
                  key={paso.titulo}
                  className={`${styles.paso} ${styles[`paso_${paso.estado}`]}`}
                >
                  {i < pasos.length - 1 && (
                    <span
                      className={`${styles.pasoLinea} ${paso.estado === "hecho" ? styles.pasoLineaHecha : ""}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.pasoDot}>
                    {paso.estado === "hecho" ? (
                      <FiCheck aria-label="Completado" />
                    ) : paso.estado === "bloqueado" ? (
                      <FiLock aria-label="Bloqueado" />
                    ) : paso.estado === "meta" ? (
                      <FiZap aria-hidden="true" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className={styles.pasoTexto}>
                    <strong>{paso.titulo}</strong>
                    <span>{paso.texto}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── ACCIONES ── */}
        <div className={`${styles.bloque} ${styles.acciones}`}>
          <button
            type="button"
            className={styles.botonSecundario}
            onClick={handleFinalizar}
          >
            <FiChevronLeft aria-hidden="true" />
            Volver a mis solicitudes
          </button>
          {rechazada
            ? onNuevaSolicitud && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={onNuevaSolicitud}
                  className={styles.botonPrincipal}
                  iconRight={<FiRefreshCw size={15} />}
                >
                  Realizar otra solicitud
                </Button>
              )
            : accionPrincipal && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={accionPrincipal.onClick}
                  className={styles.botonPrincipal}
                  iconRight={<FiArrowRight size={15} />}
                >
                  {accionPrincipal.texto}
                </Button>
              )}
        </div>
      </article>
    </div>
  );
}

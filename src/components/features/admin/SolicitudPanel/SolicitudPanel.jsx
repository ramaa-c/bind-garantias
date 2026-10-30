import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FiX,
  FiCheck,
  FiMinus,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiList,
  FiActivity,
  FiBriefcase,
  FiChevronRight,
  FiShield,
  FiFolder,
  FiUserCheck,
  FiServer,
  FiInbox,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { BotonIcono } from "../../../ui/BotonIcono/BotonIcono";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { useHistorialCdaLinea } from "../../../../hooks/useLinea";
import { useObtenerTodosCdas } from "../../../../hooks/useCda";
import { useObtenerGrupoCdaConCdas } from "../../../../hooks/useCadenaValor";
import { esAdminGeneralToken } from "../../../../api/tokenApi";
import { PANTALLA_LINEAS } from "../../../../utils/pantallasCda";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import {
  formatearMomentoControl,
  ultimaEjecucionPorCda,
  ordenarEjecucionesCda,
  normalizarHistorialLinea,
} from "../../../../utils/executeCda";
import {
  ESTADO_APROBADA,
  ESTADO_RECHAZADA,
  ESTADO_CANCELADA,
  ESTADO_VENCIDA,
  quitarPrefijoRechazoAutomatico,
} from "../../../../utils/estadoLimiteSocio";
import styles from "./SolicitudPanel.module.css";

const PESTANAS = [
  { key: "resumen", label: "Resumen" },
  { key: "criterios", label: "Criterios" },
  { key: "sgr", label: "Estado en SGR+" },
];

const PASOS_SGR = [
  "Recepción de la solicitud en SGR+",
  "Análisis y conformidad de riesgo crediticio",
  "Emisión del certificado de garantía",
  "Firma del contrato",
  "Línea activa para operar",
];

const estadoEjecucion = (fila) => {
  const estadoId = Number(fila?.estadoexecutecdaid ?? fila?.EstadoExecuteCdaID ?? 0);
  if (estadoId === 3) return "ok";
  if (estadoId === 2) return "error";
  return "pendiente";
};

const formatearFechaHora = (iso) => {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  const tieneHora = fecha.getHours() !== 0 || fecha.getMinutes() !== 0;
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    ...(tieneHora ? { timeStyle: "short" } : {}),
  }).format(fecha);
};

const tonoEstado = (estadoId) => {
  if (estadoId === ESTADO_APROBADA) return "ok";
  if (estadoId === ESTADO_RECHAZADA) return "error";
  if (estadoId === ESTADO_CANCELADA || estadoId === ESTADO_VENCIDA) return "neutro";
  return "pendiente";
};

const IconoTono = ({ tono }) => {
  if (tono === "ok") return <FiCheck />;
  if (tono === "error") return <FiX />;
  if (tono === "pendiente") return <FiClock />;
  return <FiMinus />;
};

const PasoAvance = ({ icono, titulo, detalle, tono }) => (
  <li className={`${styles.paso} ${styles[`tono_${tono}`]}`}>
    <span className={styles.pasoIcono} aria-hidden="true">
      {icono}
    </span>
    <span className={styles.pasoTexto}>
      <span className={styles.pasoTitulo}>{titulo}</span>
      <span className={styles.pasoDetalle}>{detalle}</span>
    </span>
    <span className={styles.pasoEstado} aria-hidden="true">
      <IconoTono tono={tono} />
    </span>
  </li>
);

const Dato = ({ label, valor, ancho }) => (
  <div className={`${styles.dato} ${ancho ? styles.datoAncho : ""}`}>
    <dt>{label}</dt>
    <dd>{valor || "—"}</dd>
  </div>
);

export const SolicitudPanel = ({
  isOpen,
  onClose,
  solicitud,
  soloLectura = false,
  pausado = false,
  modeloDocumento,
  faltantesConfiguracion = null,
  cargandoDocumento = false,
  decidiendo = false,
  migrando = false,
  onAceptar,
  onRechazar,
  onMigrar,
  onDocumento,
  onVerCriterios,
  onVerActividad,
}) => {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState("resumen");
  const [verHistorialCompleto, setVerHistorialCompleto] = useState(false);
  const botonCerrarRef = useRef(null);

  const tipoLimiteSocioId = solicitud?.id;
  const { data: historialRaw, isLoading: cargandoHistorial } = useHistorialCdaLinea(
    tipoLimiteSocioId,
    isOpen,
  );
  const esAdminGeneral = esAdminGeneralToken();
  const { data: catalogoCdas } = useObtenerTodosCdas({ enabled: isOpen && esAdminGeneral });
  const { data: grupoLineas } = useObtenerGrupoCdaConCdas(
    isOpen && !esAdminGeneral ? solicitud?.cadenavalorid : null,
    PANTALLA_LINEAS,
  );
  const {
    isValid: legajoValido,
    totalRequisitos,
    requisitosCompletados,
    isLoading: cargandoLegajo,
  } = useValidacionLegajo({
    adminMode: true,
    socioIdActivo: isOpen ? solicitud?.socioid : null,
    tipoPersonaId: solicitud?.tipoPersonaId,
    nombreEmpresa: solicitud?.cliente,
    cadenaId: solicitud?.cadenavalorid,
  });

  const descripcionPorCda = useMemo(() => {
    const mapa = new Map();
    [...(grupoLineas?.cdas || []), ...(Array.isArray(catalogoCdas) ? catalogoCdas : [])].forEach((c) => {
      const id = Number(c.cdaid ?? c.CdaID);
      if (id) mapa.set(id, c.descripcion || c.Descripcion || "");
    });
    return mapa;
  }, [catalogoCdas, grupoLineas]);

  const historial = useMemo(() => normalizarHistorialLinea(historialRaw), [historialRaw]);
  const ultimas = useMemo(() => ultimaEjecucionPorCda(historial), [historial]);
  const historialOrdenado = useMemo(() => ordenarEjecucionesCda(historial), [historial]);
  const superados = ultimas.filter((f) => estadoEjecucion(f) === "ok").length;
  const noSuperados = ultimas.filter((f) => estadoEjecucion(f) === "error").length;

  useEffect(() => {
    if (!isOpen) return undefined;
    const alPresionar = (e) => {
      if (e.key === "Escape" && !pausado) onClose();
    };
    document.addEventListener("keydown", alPresionar);
    const enfoque = setTimeout(() => botonCerrarRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", alPresionar);
      clearTimeout(enfoque);
    };
  }, [isOpen, onClose, pausado]);

  if (!isOpen || !solicitud) return null;

  const estadoId = Number(solicitud.tipoLimiteEstadoId);
  const esPendiente = tonoEstado(estadoId) === "pendiente";
  const esAprobada = estadoId === ESTADO_APROBADA;
  const observaciones = quitarPrefijoRechazoAutomatico(
    solicitud.raw?.observaciones ?? solicitud.raw?.Observaciones,
  );

  const tonoCriterios = cargandoHistorial
    ? "neutro"
    : ultimas.length === 0
      ? "neutro"
      : noSuperados > 0
        ? "error"
        : superados === ultimas.length
          ? "ok"
          : "pendiente";

  const detalleCriterios = cargandoHistorial
    ? "Consultando evaluaciones…"
    : ultimas.length === 0
      ? "Sin evaluaciones registradas para esta línea"
      : `${superados} de ${ultimas.length} superados${noSuperados ? ` · ${noSuperados} no superado${noSuperados === 1 ? "" : "s"}` : ""}`;

  const decisionDetalle = solicitud.accionPendiente;

  const legajoCompleto = solicitud.legajoMigrado || (!cargandoLegajo && legajoValido);
  const faltantesContacto = solicitud.faltantesContacto || [];
  const faltaContacto = faltantesContacto.length > 0;
  const textoFaltantesContacto = `La empresa todavía no tiene ${faltantesContacto.join(" ni ")}`;
  const configuracionCompleta = Array.isArray(faltantesConfiguracion) && faltantesConfiguracion.length === 0;
  const textoConfiguracion =
    faltantesConfiguracion === null
      ? "Revisando la configuración de la cadena…"
      : `Falta configurar ${faltantesConfiguracion.join(", ")}`;
  const puedeAceptar = legajoCompleto && !faltaContacto && configuracionCompleta;
  const avisoMigrar =
    faltaContacto && !solicitud.legajoMigrado
      ? textoFaltantesContacto
      : !configuracionCompleta
        ? textoConfiguracion
        : null;

  const tonoLegajo = legajoCompleto && !faltaContacto ? "ok" : cargandoLegajo ? "neutro" : "pendiente";

  const detalleRequisitos = solicitud.legajoMigrado
    ? "Legajo completo"
    : cargandoLegajo
      ? "Revisando el legajo…"
      : legajoValido
        ? totalRequisitos === 0
          ? "La cadena no pide requisitos adicionales"
          : `Completo · ${totalRequisitos} de ${totalRequisitos} requisitos`
        : `${requisitosCompletados} de ${totalRequisitos} requisitos completos`;

  const detalleLegajo =
    faltaContacto && !cargandoLegajo
      ? `${detalleRequisitos} · Falta ${faltantesContacto.join(" y ")} de la empresa`
      : detalleRequisitos;

  const avisoAceptar = puedeAceptar
    ? null
    : cargandoLegajo
      ? "Revisando el legajo de la empresa…"
      : !legajoCompleto
        ? "El legajo de la empresa está incompleto"
        : faltaContacto
          ? textoFaltantesContacto
          : textoConfiguracion;

  const contenidoResumen = (
    <>
      <section className={styles.seccion}>
        <h3 className={styles.seccionTitulo}>Avance de la solicitud</h3>
        <ol className={styles.pasos}>
          <PasoAvance
            icono={<FiFileText />}
            titulo="Solicitud cargada"
            detalle={`Creada el ${formatearFechaHora(solicitud.creadoISO)}`}
            tono="ok"
          />
          <PasoAvance
            icono={<FiShield />}
            titulo="Criterios de la línea"
            detalle={detalleCriterios}
            tono={tonoCriterios}
          />
          <PasoAvance
            icono={<FiFolder />}
            titulo="Legajo de la empresa"
            detalle={detalleLegajo}
            tono={tonoLegajo}
          />
          <PasoAvance
            icono={<FiUserCheck />}
            titulo="Decisión del administrador"
            detalle={decisionDetalle}
            tono={tonoEstado(estadoId)}
          />
          <PasoAvance
            icono={<FiRefreshCw />}
            titulo="Migración a SGR+"
            detalle={
              solicitud.legajoMigrado
                ? "Empresa migrada a SGR+"
                : faltaContacto
                  ? `Requiere ${faltantesContacto.join(" y ")} de la empresa`
                  : "Se migra al aceptar la solicitud"
            }
            tono={solicitud.legajoMigrado ? "ok" : "pendiente"}
          />
          <PasoAvance
            icono={<FiServer />}
            titulo="Estado en SGR+"
            detalle="Próximamente"
            tono="neutro"
          />
        </ol>
      </section>

      <section className={styles.seccion}>
        <h3 className={styles.seccionTitulo}>Datos de la solicitud</h3>
        <dl className={styles.datos}>
          <Dato label="Empresa" valor={solicitud.cliente} />
          <Dato label="CUIT" valor={solicitud.cuit} />
          <Dato label="Email" valor={solicitud.usuario} />
          <Dato label="Cadena de valor" valor={solicitud.cadenaNombreCompleto || solicitud.cadenaNombre} />
          <Dato label="Línea" valor={solicitud.lineaNombre || solicitud.tipo} />
          <Dato label="Monto" valor={`${solicitud.moneda || "$"} ${solicitud.monto}`} />
          <Dato label="Vigencia desde" valor={formatearFechaHora(solicitud.raw?.fchvigenciadesde)} />
          <Dato label="Vigencia hasta" valor={formatearFechaHora(solicitud.raw?.fchvigenciahasta)} />
          {observaciones && <Dato label="Observaciones" valor={observaciones} ancho />}
        </dl>
      </section>

      <section className={styles.seccion}>
        <h3 className={styles.seccionTitulo}>Empresa</h3>
        <ul className={styles.accesos}>
          <li>
            <button
              type="button"
              className={styles.acceso}
              onClick={() => navigate(`/admin/empresas/${solicitud.socioid}`)}
              disabled={!solicitud.socioid}
            >
              <span className={styles.accesoIcono} aria-hidden="true">
                <FiBriefcase />
              </span>
              <span className={styles.accesoTexto}>
                <span className={styles.accesoLabel}>Ver ficha de la empresa</span>
                <span className={styles.accesoAyuda}>Legajo, documentación y terceros</span>
              </span>
              <FiChevronRight className={styles.accesoFlecha} aria-hidden="true" />
            </button>
          </li>
          {!soloLectura && (
            <li>
              <button type="button" className={styles.acceso} onClick={onVerActividad}>
                <span className={styles.accesoIcono} aria-hidden="true">
                  <FiActivity />
                </span>
                <span className={styles.accesoTexto}>
                  <span className={styles.accesoLabel}>Actividad de la empresa</span>
                  <span className={styles.accesoAyuda}>Consultas y cambios registrados</span>
                </span>
                <FiChevronRight className={styles.accesoFlecha} aria-hidden="true" />
              </button>
            </li>
          )}
        </ul>
      </section>
    </>
  );

  const filasCriterios = verHistorialCompleto ? historialOrdenado : ultimas;

  const contenidoCriterios = (
    <>
      <section className={styles.seccion}>
        <div className={styles.seccionCabecera}>
          <h3 className={styles.seccionTitulo}>Criterios de la línea</h3>
          {historialOrdenado.length > ultimas.length && (
            <button
              type="button"
              className={styles.linkTexto}
              onClick={() => setVerHistorialCompleto((v) => !v)}
            >
              {verHistorialCompleto ? "Ver solo el último resultado" : `Ver historial completo (${historialOrdenado.length})`}
            </button>
          )}
        </div>

        {cargandoHistorial ? (
          <div className={styles.criterios}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height="3.5rem" radius="0.75rem" />
            ))}
          </div>
        ) : filasCriterios.length === 0 ? (
          <div className={styles.vacio}>
            <FiInbox aria-hidden="true" />
            <p>No hay evaluaciones de criterios registradas para esta línea.</p>
          </div>
        ) : (
          <ul className={styles.criterios}>
            {filasCriterios.map((fila, i) => {
              const cdaId = Number(fila.cdaid ?? fila.CdaID);
              const tono = estadoEjecucion(fila);
              const resultado = fila.valorresultado ?? fila.ValorResultado;
              return (
                <li key={`${cdaId}-${fila.socioexecutecdaid ?? i}`} className={`${styles.criterio} ${styles[`tono_${tono}`]}`}>
                  <span className={styles.criterioIcono} aria-hidden="true">
                    <IconoTono tono={tono} />
                  </span>
                  <span className={styles.criterioTexto}>
                    <span className={styles.criterioTitulo}>
                      {descripcionPorCda.get(cdaId) || `Criterio ${cdaId}`}
                    </span>
                    <span className={styles.criterioDetalle}>
                      {fila.expresion || fila.Expresion || "—"}
                      {resultado !== undefined && resultado !== null && String(resultado).trim() !== ""
                        ? ` · Resultado: ${resultado}`
                        : ""}
                    </span>
                  </span>
                  <span className={styles.criterioMomento}>
                    {formatearMomentoControl(fila.momentocontrol ?? fila.MomentoControl)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.seccion}>
        <ul className={styles.accesos}>
          <li>
            <button type="button" className={styles.acceso} onClick={onVerCriterios}>
              <span className={styles.accesoIcono} aria-hidden="true">
                <FiList />
              </span>
              <span className={styles.accesoTexto}>
                <span className={styles.accesoLabel}>Criterios de la empresa y accionistas</span>
                <span className={styles.accesoAyuda}>Resultado por pantalla, con opción de reevaluar</span>
              </span>
              <FiChevronRight className={styles.accesoFlecha} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>
    </>
  );

  const contenidoSgr = (
    <section className={styles.seccion}>
      <div className={styles.proximamente}>
        <span className={styles.proximamenteIcono} aria-hidden="true">
          <FiServer />
        </span>
        <div>
          <p className={styles.proximamenteTitulo}>Estado real en SGR+</p>
          <p className={styles.proximamenteTexto}>
            Acá vas a ver en qué etapa está la solicitud dentro de SGR+ apenas esté disponible la integración.
          </p>
        </div>
      </div>
      <ol className={styles.pasos}>
        {PASOS_SGR.map((paso) => (
          <PasoAvance key={paso} icono={<FiClock />} titulo={paso} detalle="Sin datos todavía" tono="neutro" />
        ))}
      </ol>
    </section>
  );

  const tonoCabecera = tonoEstado(estadoId);

  return createPortal(
    <div className={styles.capa}>
      <div className={styles.fondo} onClick={onClose} aria-hidden="true" />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solicitud-panel-titulo"
      >
        <header className={styles.cabecera}>
          <div className={styles.cabeceraFila}>
            <div className={styles.cabeceraMeta}>
              <span className={styles.numero}>Solicitud N°{solicitud.id}</span>
              <span className={`${styles.pill} ${styles[`pill_${tonoCabecera}`]}`}>
                <span className={styles.pillDot} />
                {solicitud.estado}
              </span>
            </div>
            <button
              ref={botonCerrarRef}
              type="button"
              className={styles.cerrar}
              onClick={onClose}
              aria-label="Cerrar panel"
            >
              <FiX />
            </button>
          </div>
          <h2 id="solicitud-panel-titulo" className={styles.titulo}>
            {solicitud.cliente}
          </h2>
          <div className={styles.subtituloFila}>
            {solicitud.cadenaNombre && (
              <span className={styles.cadena} title={solicitud.cadenaNombreCompleto || solicitud.cadenaNombre}>
                {solicitud.cadenaNombre}
              </span>
            )}
            <p className={styles.subtitulo}>
              {[solicitud.lineaNombre || solicitud.tipo, `CUIT ${solicitud.cuit}`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className={styles.monto}>
            <span className={styles.montoLabel}>Monto solicitado</span>
            <strong className={styles.montoValor}>
              {solicitud.moneda || "$"} {solicitud.monto}
            </strong>
          </div>

          <nav className={styles.pestanas} role="tablist">
            {PESTANAS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={pestana === p.key}
                className={`${styles.pestana} ${pestana === p.key ? styles.pestanaActiva : ""}`}
                onClick={() => setPestana(p.key)}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </header>

        <div className={styles.cuerpo}>
          {pestana === "resumen" && contenidoResumen}
          {pestana === "criterios" && contenidoCriterios}
          {pestana === "sgr" && contenidoSgr}
        </div>

        <footer className={styles.pie}>
          {!soloLectura && esPendiente ? (
            <>
              <BotonIcono
                icon={FiFileText}
                onClick={onDocumento}
                title={modeloDocumento?.motivo || "Previsualizar documento"}
                isLoading={cargandoDocumento}
                className={modeloDocumento?.disponible ? "" : styles.documentoNoDisponible}
              />
              <span className={styles.pieEspacio}>
                {avisoAceptar && <span className={styles.pieAviso}>{avisoAceptar}</span>}
              </span>
              <Button type="button" variant="danger" size="md" onClick={onRechazar} disabled={decidiendo}>
                <FiX /> Rechazar
              </Button>
              <Button
                type="button"
                variant="success"
                size="md"
                onClick={onAceptar}
                disabled={decidiendo || !puedeAceptar}
                title={avisoAceptar || "Aceptar solicitud"}
              >
                <FiCheck /> Aceptar
              </Button>
            </>
          ) : !soloLectura && esAprobada ? (
            <>
              <span className={styles.pieEspacio}>
                {avisoMigrar && <span className={styles.pieAviso}>{avisoMigrar}</span>}
              </span>
              <Button
                type="button"
                variant="outlineBlue"
                size="md"
                onClick={onMigrar}
                disabled={migrando || !!avisoMigrar}
                title={avisoMigrar || "Migrar a SGR+"}
              >
                <FiRefreshCw /> Migrar a SGR+
              </Button>
            </>
          ) : (
            <>
              <span className={styles.pieEspacio} />
              <Button type="button" variant="outlineBlue" size="md" onClick={onClose}>
                Cerrar
              </Button>
            </>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  );
};

export default SolicitudPanel;

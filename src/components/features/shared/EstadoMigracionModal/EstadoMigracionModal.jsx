import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiUsers,
  FiArrowRight,
  FiLock,
  FiPlusCircle,
} from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { Button } from "../../../ui/Button/Button";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useSocioWebPorId } from "../../../../hooks/useSocios";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useAccesoDashboardCliente } from "../../../../hooks/useAccesoDashboardCliente";
import { useChannel } from "../../../../context/useChannel";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { ESTRUCTURA_LEGAJO } from "../DocumentosLegajo/DocumentosLegajo.constants";
import { ESTRUCTURA_SOCIOS } from "../SociosLegajo/SociosLegajo.constants";
import styles from "./EstadoMigracionModal.module.css";

// Lo pendiente va siempre arriba (con acceso directo a su pestaña) y los
// completos se agrupan en un desplegable, para que la lista no crezca de
// más cuando la cadena pide muchos documentos. Una sección 100% completa se
// reduce a una sola fila.
function ChecklistSection({ icon, title, items, bloqueado, notaBloqueo, numero, accion, onAccion }) {
  const [verCompletos, setVerCompletos] = useState(false);
  if (items.length === 0) return null;
  const completados = items.filter((item) => item.done);
  const pendientes = items.filter((item) => !item.done);
  const titulo = `${numero != null ? `${numero}. ` : ""}${title}`;

  if (!bloqueado && pendientes.length === 0) {
    return (
      <div className={`${styles.section} ${styles.sectionCompleta}`}>
        <span className={styles.okBadge} aria-hidden="true">
          <FiCheck />
        </span>
        <span className={styles.sectionTitle}>{titulo}</span>
        <span className={`${styles.sectionTally} ${styles.tallyOk}`}>
          {completados.length}/{items.length} · Completo
        </span>
      </div>
    );
  }

  const renderItem = (item) => (
    <li key={item.key} className={styles.checklistItem}>
      {bloqueado ? (
        <span className={styles.lockBadge} aria-hidden="true" />
      ) : item.done ? (
        <span className={styles.okBadge} aria-hidden="true">
          <FiCheck />
        </span>
      ) : (
        <span className={styles.pendBadge} aria-hidden="true" />
      )}
      <span
        className={
          bloqueado ? styles.labelBloqueado : item.done ? styles.labelDone : styles.labelPending
        }
      >
        {item.label}
      </span>
      {!bloqueado && !item.done && onAccion && (
        <button type="button" className={styles.itemAccion} onClick={onAccion}>
          {accion} <FiArrowRight aria-hidden="true" />
        </button>
      )}
    </li>
  );

  return (
    <div className={`${styles.section} ${bloqueado ? styles.sectionBloqueada : ""}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          {icon} {titulo}
          {bloqueado && <FiLock className={styles.lockIcon} aria-label="Bloqueado" />}
        </span>
        <span className={styles.sectionTally}>
          {completados.length}/{items.length}
        </span>
      </div>
      {bloqueado && notaBloqueo && <p className={styles.notaBloqueo}>{notaBloqueo}</p>}

      {bloqueado ? (
        <ul className={styles.checklist}>{items.map(renderItem)}</ul>
      ) : (
        <>
          <ul className={styles.checklist}>{pendientes.map(renderItem)}</ul>
          {completados.length > 0 && (
            <>
              <button
                type="button"
                className={styles.toggleCompletos}
                aria-expanded={verCompletos}
                onClick={() => setVerCompletos((v) => !v)}
              >
                {verCompletos
                  ? `Ocultar ${completados.length} completo${completados.length !== 1 ? "s" : ""}`
                  : `${completados.length} completo${completados.length !== 1 ? "s" : ""}`}
                {verCompletos ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
              </button>
              {verCompletos && <ul className={styles.checklist}>{completados.map(renderItem)}</ul>}
            </>
          )}
        </>
      )}
    </div>
  );
}

export function EstadoMigracionModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { basePath } = useChannel();
  const { socioIdActivo, nombreEmpresa, tipoPersonaId } = useEmpresaActiva();
  const { data: socioWeb, isLoading: cargandoSocio } = useSocioWebPorId(socioIdActivo);
  const {
    requisitos,
    archivosBackend,
    accionistasCompletos,
    representanteLegalCompletos,
    apoderadosCompletos,
    agentesBolsaCompletos,
    isLoading: cargandoValidacion,
  } = useValidacionLegajo();
  const { hayLineaActiva, legajoDesbloqueado, documentacionDesbloqueada } =
    useAccesoDashboardCliente();

  // Numeración de pasos: solo tiene sentido con línea activa (sin línea el
  // flujo sigue siendo el de siempre, sin pasos). "Solicitar línea" se
  // cuenta como paso 1 únicamente mientras siga siendo lo que falta - una
  // vez que ya hay una solicitud en curso, no tiene sentido seguir
  // mostrándolo como un paso pendiente en esta modal.
  const mostrarPasoSolicitud = hayLineaActiva && !legajoDesbloqueado;
  const numeroLegajo = hayLineaActiva ? (mostrarPasoSolicitud ? 2 : 1) : null;
  const numeroDocumentacion = hayLineaActiva ? (mostrarPasoSolicitud ? 3 : 2) : null;

  const cargando = cargandoSocio || cargandoValidacion;
  const esPersonaFisica = Number(tipoPersonaId) === 1;
  const legajoSgrPlus = Number(socioWeb?.legajo) > 0 ? socioWeb.legajo : null;
  const estaMigrado = !!legajoSgrPlus;

  const documentosChecklist = ESTRUCTURA_LEGAJO.filter(
    (doc) => doc.category === "Documentación" && requisitos?.documentos?.[doc.key] === 1,
  ).map((doc) => ({
    key: doc.key,
    label: doc.title,
    done: (archivosBackend || []).some(
      (a) => a.tipodocumentoarchivoid === socioArchivoService.TIPO_DOCUMENTO_MAP[doc.key],
    ),
  }));

  const completitudPorTab = {
    accionistas: accionistasCompletos,
    representanteLegal: representanteLegalCompletos,
    apoderados: apoderadosCompletos,
    agentesBolsa: agentesBolsaCompletos,
  };
  const legajoChecklist = ESTRUCTURA_SOCIOS.filter(
    (doc) =>
      doc.key !== "usuarios" &&
      requisitos?.relaciones?.[doc.key] === 1 &&
      !(doc.key === "accionistas" && esPersonaFisica) &&
      !(doc.key === "representanteLegal" && esPersonaFisica),
  ).map((doc) => ({
    key: doc.key,
    label: doc.title,
    done: !!completitudPorTab[doc.key],
  }));

  const totalItems = documentosChecklist.length + legajoChecklist.length;
  const itemsCompletados =
    documentosChecklist.filter((i) => i.done).length +
    legajoChecklist.filter((i) => i.done).length;

  const legajoListo = itemsCompletados === totalItems;
  const porcentaje = totalItems > 0 ? Math.round((itemsCompletados / totalItems) * 100) : 0;

  const faltanDocumentos = documentosChecklist.some((i) => !i.done);
  const faltanLegajo = legajoChecklist.some((i) => !i.done);

  const legajoCompleto = estaMigrado || legajoListo;
  const estado = legajoCompleto ? "completo" : "pendiente";
  const tono = estado === "completo" ? "success" : "pending";

  // Con totalItems=0 (cadena sin ningún requisito obligatorio) "Ya cargaste
  // todos los datos..." se puede malinterpretar como que sí se subió algo:
  // en ese caso no se cargó nada porque no había nada para cargar, no
  // porque ya esté todo hecho.
  const HERO_POR_ESTADO = {
    completo: {
      icon: <FiCheckCircle size={22} />,
      titulo: "Legajo completo",
      subtitulo:
        totalItems === 0
          ? "Esta cadena no requiere documentos ni datos adicionales."
          : "Ya cargaste todos los datos y documentos de tu empresa.",
    },
  };
  const hero = HERO_POR_ESTADO[estado];

  const irA = (path) => {
    navigate(`${basePath}${path}`);
    onClose();
  };

  const mostrarCtas = !cargando && !legajoCompleto && (faltanDocumentos || faltanLegajo);
  const irALegajo = faltanLegajo && legajoDesbloqueado ? () => irA("/legajo") : null;
  const irADocumentacion =
    faltanDocumentos && documentacionDesbloqueada ? () => irA("/documentacion") : null;
  // Acción principal: lo primero que falta y está habilitado.
  const accionPrincipal = irALegajo || irADocumentacion;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estado de tu legajo"
      subtitle={nombreEmpresa}
      maxWidth="560px"
      footer={
        !cargando && (
          <>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {mostrarCtas && accionPrincipal && (
              <Button variant="primary" onClick={accionPrincipal} iconRight={<FiArrowRight size={14} />}>
                Completar lo que falta
              </Button>
            )}
          </>
        )
      }
    >
      {cargando ? (
        <Spinner center size={50} />
      ) : (
        <div className={styles.container}>
          {hero ? (
            <div className={`${styles.hero} ${styles[`hero-${tono}`]}`}>
              <span className={styles.heroIcon}>{hero.icon}</span>
              <div className={styles.heroText}>
                <h3 className={styles.heroTitulo}>{hero.titulo}</h3>
                <p className={styles.heroSubtitulo}>{hero.subtitulo}</p>
              </div>
            </div>
          ) : (
            totalItems > 0 && (
              <div className={styles.resumen}>
                <span className={styles.gauge} role="img" aria-label={`${porcentaje} % completo`}>
                  <svg viewBox="0 0 76 44" className={styles.gaugeChart} aria-hidden="true">
                    <path className={styles.gaugeTrack} d="M8 38 A30 30 0 0 1 68 38" pathLength="100" />
                    <path
                      className={styles.gaugeFill}
                      d="M8 38 A30 30 0 0 1 68 38"
                      pathLength="100"
                      strokeDasharray={`${porcentaje} 100`}
                    />
                  </svg>
                  <span className={styles.gaugeLabel}>{porcentaje}%</span>
                </span>
                <div className={styles.resumenTexto}>
                  <strong>
                    {itemsCompletados} de {totalItems} requisitos
                  </strong>
                  <span>Esto es lo que te falta completar.</span>
                </div>
              </div>
            )
          )}

          {mostrarPasoSolicitud && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>
                  <FiPlusCircle size={13} /> 1. Solicitar línea
                </span>
              </div>
              <p className={styles.notaBloqueo}>
                Cargá tu primera solicitud para poder continuar.
              </p>
            </div>
          )}
          <ChecklistSection
            icon={<FiUsers size={13} />}
            title="Legajo"
            items={legajoChecklist}
            bloqueado={!legajoDesbloqueado}
            notaBloqueo="Se habilita cuando tengas una solicitud en curso."
            numero={numeroLegajo}
            accion="Completar"
            onAccion={irALegajo}
          />
          <ChecklistSection
            icon={<FiFileText size={13} />}
            title="Documentación"
            items={documentosChecklist}
            bloqueado={!documentacionDesbloqueada}
            notaBloqueo="Se habilita cuando completes el Legajo al 100%."
            numero={numeroDocumentacion}
            accion="Subir"
            onAccion={irADocumentacion}
          />
        </div>
      )}
    </Modal>
  );
}

export default EstadoMigracionModal;

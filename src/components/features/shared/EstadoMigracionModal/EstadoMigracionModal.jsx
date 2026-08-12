import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiCircle,
  FiAlertTriangle,
  FiFileText,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { Button } from "../../../ui/Button/Button";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useSocioWebPorId } from "../../../../hooks/useSocios";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useChannel } from "../../../../context/ChannelContext";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { ESTRUCTURA_LEGAJO } from "../DocumentosLegajo/DocumentosLegajo";
import { ESTRUCTURA_SOCIOS } from "../SociosLegajo/SociosLegajo";
import styles from "./EstadoMigracionModal.module.css";

// Cada item lleva su propio ícono de sección (Documentación / Legajo) y una
// leyenda de "X de Y" — nada de porcentajes ni acordeones acá adentro: el
// resumen global ya lo da la barra de progreso de arriba, esto es el
// detalle de qué falta puntualmente.
function ChecklistSection({ icon, title, items }) {
  if (items.length === 0) return null;
  const completados = items.filter((item) => item.done).length;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          {icon} {title}
        </span>
        <span className={styles.sectionTally}>
          {completados}/{items.length}
        </span>
      </div>
      <ul className={styles.checklist}>
        {items.map((item) => (
          <li key={item.key} className={styles.checklistItem}>
            {item.done ? (
              <FiCheckCircle className={styles.iconDone} />
            ) : (
              <FiCircle className={styles.iconPending} />
            )}
            <span className={item.done ? styles.labelDone : styles.labelPending}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Reemplaza a EmpresaPerfilModal: en vez de un perfil genérico de la empresa
// (dirección, teléfono, tipo de persona...), esto es pura foto del estado de
// migración a SGR+ — lo mismo que ya calculaba LegajoUniversalBar, pero con
// el detalle de qué documento/dato puntual falta. Se abre desde ahí (ver
// LegajoUniversalBar.jsx, el contenedor con la clase containerValid/
// containerInvalid) y también desde la card de empresa del Sidebar.
export function EstadoMigracionModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { channelInfo } = useChannel();
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

  const cargando = cargandoSocio || cargandoValidacion;
  const esPersonaFisica = Number(tipoPersonaId) === 1;
  const legajoSgrPlus = Number(socioWeb?.legajo) > 0 ? socioWeb.legajo : null;
  const estaMigrado = !!legajoSgrPlus;

  // Mismos nombres que ve el usuario en la pestaña Documentación: se filtra
  // por lo que la cadena realmente exige (requisitos.documentos) y se marca
  // hecho/pendiente contra los archivos ya subidos.
  const documentosChecklist = ESTRUCTURA_LEGAJO.filter(
    (doc) => doc.category === "Documentación" && requisitos?.documentos?.[doc.key] === 1,
  ).map((doc) => ({
    key: doc.key,
    label: doc.title,
    done: (archivosBackend || []).some(
      (a) => a.tipodocumentoarchivoid === socioArchivoService.TIPO_DOCUMENTO_MAP[doc.key],
    ),
  }));

  // Mismos nombres que las pestañas de Legajo (Composición accionaria,
  // Representantes legales/Apoderado, Agentes de bolsa), filtrados por lo
  // que la cadena exige y por tipo de persona (accionistas no aplica a
  // Persona Física, ver SociosLegajo).
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
  const legajoListo = totalItems > 0 && itemsCompletados === totalItems;
  const porcentaje = totalItems > 0 ? Math.round((itemsCompletados / totalItems) * 100) : 0;

  const faltanDocumentos = documentosChecklist.some((i) => !i.done);
  const faltanLegajo = legajoChecklist.some((i) => !i.done);

  // La migración a SGR+ es un detalle interno que solo le importa al admin
  // (acordado con Victor el 2026-08-12) — de cara al cliente "migrado" y
  // "listo" son el mismo estado ("ya terminé"), sin exponer el número de
  // legajo SGR+ ni insinuar que hay una sincronización de por medio.
  const legajoCompleto = estaMigrado || legajoListo;
  const estado = legajoCompleto ? "completo" : "pendiente";
  const tono = estado === "completo" ? "success" : "pending";

  // El estado "pendiente" ya no tiene hero propio: el título y el mensaje
  // genérico ("Legajo incompleto para SGR+" / "Te falta completar...") ya se
  // ven en LegajoUniversalBar (containerInvalid) — repetirlos acá arriba del
  // checklist no agregaba nada, solo empujaba hacia abajo el detalle
  // puntual que es lo único que este modal aporta de más.
  const HERO_POR_ESTADO = {
    completo: {
      icon: <FiCheckCircle size={22} />,
      titulo: "Legajo completo",
      subtitulo: "Ya cargaste todos los datos y documentos de tu empresa.",
    },
  };
  const hero = HERO_POR_ESTADO[estado];

  const irA = (path) => {
    navigate(`/${channelInfo?.id || "default"}${path}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estado de tu legajo"
      subtitle={nombreEmpresa}
      maxWidth="520px"
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
              <p className={styles.pendingLead}>
                <FiAlertTriangle size={13} /> Esto es lo que te falta completar:
              </p>
            )
          )}

          {totalItems > 0 && (
            <div className={styles.progressRow}>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${styles[`fill-${tono}`]}`}
                  style={{ transform: `scaleX(${porcentaje / 100})` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {itemsCompletados}/{totalItems}
              </span>
            </div>
          )}

          <ChecklistSection
            icon={<FiFileText size={13} />}
            title="Documentación"
            items={documentosChecklist}
          />
          <ChecklistSection
            icon={<FiUsers size={13} />}
            title="Legajo"
            items={legajoChecklist}
          />

          {!legajoCompleto && (faltanDocumentos || faltanLegajo) && (
            <div className={styles.ctaRow}>
              {faltanDocumentos && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => irA("/documentacion")}
                  iconRight={<FiArrowRight size={14} />}
                >
                  Completar documentación
                </Button>
              )}
              {faltanLegajo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => irA("/legajo")}
                  iconRight={<FiArrowRight size={14} />}
                >
                  Completar legajo
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default EstadoMigracionModal;

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

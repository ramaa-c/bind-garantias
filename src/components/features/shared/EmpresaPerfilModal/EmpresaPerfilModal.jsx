import React from "react";
import { useLocation } from "react-router-dom";
import {
  FiMapPin,
  FiPhone,
  FiCheckCircle,
  FiCircle,
  FiFileText,
  FiUsers,
  FiHash,
  FiClock,
} from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useSocioWebPorId } from "../../../../hooks/useSocios";
import { useEstadoSocio } from "../../../../hooks/useCatalogos";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { ESTRUCTURA_LEGAJO } from "../DocumentosLegajo/DocumentosLegajo";
import { ESTRUCTURA_SOCIOS } from "../SociosLegajo/SociosLegajo";
import styles from "./EmpresaPerfilModal.module.css";

const getTipoPersonaLabel = (tipoPersonaId) => {
  const id = Number(tipoPersonaId);
  if (id === 1) return "Persona Física";
  if (id === 10) return "Persona Jurídica";
  return null;
};

const resolverLabel = (opciones, id) => {
  if (id === undefined || id === null || Number(id) === 0) return null;
  const encontrada = (opciones || []).find((o) => o.value === String(id));
  return encontrada?.label || null;
};

const getEstadoTono = (label) => {
  const texto = String(label || "").toLowerCase();
  if (/rechaz|baja|inactiv|suspend/.test(texto)) return "danger";
  if (/pendient|proceso|revisi/.test(texto)) return "warning";
  if (/activ|aprob|complet/.test(texto)) return "success";
  return "neutral";
};

const formatCuit = (cuit) => {
  const digits = String(cuit || "").replace(/\D/g, "");
  if (digits.length !== 11) return cuit || "-";
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
};

// Cada item lleva su propio ícono de sección (Documentación / Legajo) y una
// leyenda de "X de Y" — nada de porcentajes ni acordeones: es un perfil de
// solo lectura, la idea es que se lea de un vistazo.
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

export function EmpresaPerfilModal({ isOpen, onClose }) {
  const { socioIdActivo, nombreEmpresa, cuitActivo, direccion, telefono, tipoPersonaId } =
    useEmpresaActiva();
  const { data: socioWeb, isLoading: cargandoSocio } = useSocioWebPorId(socioIdActivo);
  const { data: estadosSocio } = useEstadoSocio();
  const {
    requisitos,
    archivosBackend,
    accionistasCompletos,
    representantesCompletos,
    agentesBolsaCompletos,
    isLoading: cargandoValidacion,
  } = useValidacionLegajo();

  const cargando = cargandoSocio || cargandoValidacion;

  // El estado de migración a SGR+ solo tiene sentido como contexto de lo que
  // se está mirando en Documentación o Legajo (son las dos pantallas que
  // alimentan la migración) — en cualquier otra pantalla (ej. Solicitudes)
  // se oculta para no mezclar temas.
  const location = useLocation();
  const mostrarMigracion =
    location.pathname.includes("/documentacion") || location.pathname.includes("/legajo");

  const tipoPersonaLabel = getTipoPersonaLabel(tipoPersonaId);
  const estadoLabel = resolverLabel(estadosSocio?.opciones, socioWeb?.socioestadoid);
  const estadoTono = getEstadoTono(estadoLabel);
  const legajoSgrPlus = Number(socioWeb?.legajo) > 0 ? socioWeb.legajo : null;
  const esPersonaFisica = Number(tipoPersonaId) === 1;

  // Mismos nombres que ve el usuario en la pestaña Documentación: se filtra
  // por lo que la cadena realmente exige (requisitos.documentos) y se marca
  // hecho/pendiente contra los archivos ya subidos, igual que el punto de
  // estado de cada tab en DocumentosLegajo.
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
  // Persona Física, ver SociosLegajo). La completitud reutiliza los mismos
  // flags que ya usa el badge de cada pestaña — ningún criterio nuevo.
  const completitudPorTab = {
    accionistas: accionistasCompletos,
    representantes: representantesCompletos,
    agentesBolsa: agentesBolsaCompletos,
  };
  const legajoChecklist = ESTRUCTURA_SOCIOS.filter(
    (doc) =>
      doc.key !== "usuarios" &&
      requisitos?.relaciones?.[doc.key] === 1 &&
      !(doc.key === "accionistas" && esPersonaFisica),
  ).map((doc) => ({
    key: doc.key,
    label: doc.key === "representantes" && esPersonaFisica ? "Apoderado" : doc.title,
    done: !!completitudPorTab[doc.key],
  }));

  const totalItems = documentosChecklist.length + legajoChecklist.length;
  const itemsCompletados =
    documentosChecklist.filter((i) => i.done).length +
    legajoChecklist.filter((i) => i.done).length;
  const legajoListo = totalItems > 0 && itemsCompletados === totalItems;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Perfil de la empresa" maxWidth="560px">
      {cargando ? (
        <Spinner center size={50} />
      ) : (
        <div className={styles.container}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {(nombreEmpresa || "?").charAt(0).toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <h3 className={styles.profileName}>{nombreEmpresa}</h3>
              <p className={styles.profileCuit}>CUIT {formatCuit(cuitActivo)}</p>
              <div className={styles.badgeRow}>
                {tipoPersonaLabel && (
                  <span className={styles.badge}>{tipoPersonaLabel}</span>
                )}
                {estadoLabel && (
                  <span className={`${styles.badge} ${styles[`badge-${estadoTono}`]}`}>
                    {estadoLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(direccion || telefono) && (
            <div className={styles.contactRow}>
              {direccion && (
                <span className={styles.contactItem}>
                  <FiMapPin size={13} /> {direccion}
                </span>
              )}
              {telefono && (
                <span className={styles.contactItem}>
                  <FiPhone size={13} /> {telefono}
                </span>
              )}
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

          {mostrarMigracion && (
            <div
              className={`${styles.migrationBanner} ${
                legajoSgrPlus
                  ? styles.migrationDone
                  : legajoListo
                    ? styles.migrationReady
                    : styles.migrationPending
              }`}
            >
              {legajoSgrPlus ? (
                <>
                  <FiCheckCircle size={16} />
                  <span>
                    Migrado a SGR+ <strong>· Legajo #{legajoSgrPlus}</strong>
                  </span>
                </>
              ) : legajoListo ? (
                <>
                  <FiHash size={16} />
                  <span>Todo listo — la migración a SGR+ se dispara automáticamente</span>
                </>
              ) : (
                <>
                  <FiClock size={16} />
                  <span>
                    Faltan {totalItems - itemsCompletados} de {totalItems} requisitos para migrar a SGR+
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default EmpresaPerfilModal;

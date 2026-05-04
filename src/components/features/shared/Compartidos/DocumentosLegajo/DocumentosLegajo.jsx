import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiBriefcase,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiExternalLink,
  FiUsers,
} from "react-icons/fi";
import { CargaArchivos } from "../../../../ui";
import styles from "./DocumentosLegajo.module.css";

const ESTRUCTURA_LEGAJO = [
  {
    category: "Empresa",
    key: "perfil",
    title: "Perfil corporativo",
    info: "Datos identificatorios registrados en la plataforma.",
  },
  {
    category: "Documentación",
    key: "certificadoPyme",
    title: "Certificado de PyME",
    info: "Acredita tu condición ante la AFIP y organismos. Si no lo tenés, podés ",
    linkText: "obtenerlo aquí.",
    url: "https://pyme.produccion.gob.ar/certificado/",
  },
  {
    category: "Documentación",
    key: "poderes",
    title: "Poderes",
    info: "Documento que autoriza a un representante legal.",
  },
  {
    category: "Documentación",
    key: "otrosDocumentos",
    title: "Otros documentos",
    info: "Adjuntá cualquier otro documento que consideres necesario.",
  },
  {
    category: "Socios",
    key: "socios",
    title: "Composición accionaria",
    info: "Administración del cuadro accionario y representantes.",
  },
];

const MOCK_PROFILE = {
  cuit: "30-71622409-7",
  razonSocial: "ADDITIVE SRL",
  direccion: "Entre Ríos Av. 1699, Liniers, CABA",
  telefono: "1111111111",
};

export function DocumentosLegajo() {
  const { control, setValue } = useFormContext();
  const formValues = useWatch({ control });
  const [activeTab, setActiveTab] = useState(ESTRUCTURA_LEGAJO[0].key);
  const { intentoAvanzar } = formValues;

  const handleFileUpload = (key, file) =>
    setValue(key, file, { shouldValidate: true, shouldDirty: true });
  const handleFileRemove = (key) =>
    setValue(key, null, { shouldValidate: true, shouldDirty: true });

  return (
    <div className={styles.workspace}>
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        {ESTRUCTURA_LEGAJO.map((doc, index) => {
          const isNewCategory =
            index === 0 ||
            doc.category !== ESTRUCTURA_LEGAJO[index - 1].category;
          const isPerfil = doc.key === "perfil";
          const isSocios = doc.key === "socios";
          const currentFile = formValues[doc.key];
          const isComplete = isPerfil || isSocios || !!currentFile;
          const hasError =
            intentoAvanzar && !isPerfil && !isSocios && !currentFile;
          const isActive = activeTab === doc.key;

          return (
            <React.Fragment key={doc.key}>
              {isNewCategory && (
                <p className={styles.categoryLabel}>{doc.category}</p>
              )}
              <button
                type="button"
                onClick={() => setActiveTab(doc.key)}
                className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
              >
                {isActive && <span className={styles.activeBar} />}
                <span className={styles.tabTitle}>{doc.title}</span>
                <span
                  className={`${styles.statusDot} ${isComplete ? styles.dotGreen : hasError ? styles.dotRed : styles.dotGray}`}
                />
              </button>
            </React.Fragment>
          );
        })}
      </aside>

      {/* ── VIEWER ──────────────────────────────────────────────────────── */}
      {ESTRUCTURA_LEGAJO.map((doc) => {
        if (activeTab !== doc.key) return null;
        const isPerfil = doc.key === "perfil";
        const isSocios = doc.key === "socios";
        const currentFile = formValues[doc.key];
        const hasError =
          intentoAvanzar && !isPerfil && !isSocios && !currentFile;

        return (
          <section key={doc.key} className={styles.viewer}>
            {/* HEADER */}
            <header className={styles.viewerHeader}>
              <div className={styles.viewerMeta}>
                <span className={styles.viewerBadge}>{doc.category}</span>
              </div>
              <h4 className={styles.viewerTitle}>{doc.title}</h4>
              <p className={styles.viewerInfo}>
                {doc.info}
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.helperLink}
                  >
                    {doc.linkText} <FiExternalLink size={11} />
                  </a>
                )}
              </p>
            </header>

            {/* CONTENIDO */}
            {isPerfil ? (
              <div className={styles.perfilGrid}>
                {[
                  {
                    icon: <FiBriefcase size={13} />,
                    label: "Razón Social",
                    value: MOCK_PROFILE.razonSocial,
                  },
                  {
                    icon: <FiCreditCard size={13} />,
                    label: "CUIT",
                    value: MOCK_PROFILE.cuit,
                  },
                  {
                    icon: <FiMapPin size={13} />,
                    label: "Domicilio",
                    value: MOCK_PROFILE.direccion,
                  },
                  {
                    icon: <FiPhone size={13} />,
                    label: "Teléfono",
                    value: MOCK_PROFILE.telefono,
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className={styles.perfilChip}>
                    <div className={styles.perfilChipHeader}>
                      <span className={styles.perfilChipIcon}>{icon}</span>
                      <span className={styles.perfilChipLabel}>{label}</span>
                    </div>
                    <span className={styles.perfilChipValue}>{value}</span>
                  </div>
                ))}
              </div>
            ) : isSocios ? (
              <div className={styles.emptySlot}>
                <FiUsers size={20} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Composición accionaria</p>
                <span className={styles.emptyText}>
                  Reservado para la gestión de integrantes y representantes.
                </span>
              </div>
            ) : (
              <div className={styles.dropzoneContainer}>
                <CargaArchivos
                  title={doc.title}
                  hasError={hasError}
                  file={
                    currentFile
                      ? { name: currentFile.name, size: currentFile.size }
                      : null
                  }
                  onClick={() =>
                    document.getElementById(`file-input-${doc.key}`).click()
                  }
                  onRemove={() => handleFileRemove(doc.key)}
                />
                <input
                  type="file"
                  id={`file-input-${doc.key}`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      handleFileUpload(doc.key, e.target.files[0]);
                  }}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

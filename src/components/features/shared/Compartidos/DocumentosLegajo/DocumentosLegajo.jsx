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
  FiUsers, // Ícono para la pestaña de socios
} from "react-icons/fi";
import { CargaArchivos } from "../../../../ui";
import styles from "./DocumentosLegajo.module.css";

// Nueva estructura categorizada
const ESTRUCTURA_LEGAJO = [
  {
    category: "Datos identificatorios",
    key: "perfil",
    title: "Perfil",
    info: "Datos identificatorios corporativos.",
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
    title: "Datos socios",
    info: "Administración del cuadro accionario y representantes.",
  },
];

const MOCK_PROFILE = {
  cuit: "30-71622409-7",
  razonSocial: "ADDITIVE SRL",
  direccion: "ENTRE RIOS AV. 1699 , LINIERS, Ciudad de Buenos Aires",
  telefono: "1111111111",
};

export function DocumentosLegajo() {
  const { control, setValue } = useFormContext();
  const formValues = useWatch({ control });

  const [activeTab, setActiveTab] = useState(ESTRUCTURA_LEGAJO[0].key);
  const { intentoAvanzar } = formValues;

  const handleFileUpload = (key, file) => {
    setValue(key, file, { shouldValidate: true, shouldDirty: true });
  };

  const handleFileRemove = (key) => {
    setValue(key, null, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className={styles.workspace}>
      {ESTRUCTURA_LEGAJO.map((doc, index) => {
        const isNewCategory =
          index === 0 || doc.category !== ESTRUCTURA_LEGAJO[index - 1].category;

        const isPerfil = doc.key === "perfil";
        const isSocios = doc.key === "socios";
        const currentFile = formValues[doc.key];

        const isComplete = isPerfil || isSocios || !!currentFile;
        const hasError = intentoAvanzar && !isPerfil && !isSocios && !currentFile;
        const isActive = activeTab === doc.key;

        return (
          <React.Fragment key={doc.key}>
            {isNewCategory && (
              <h3 className={styles.sidebarTitle}>{doc.category}</h3>
            )}

            <div className={styles.docItem}>
              <button
                type="button"
                onClick={() => setActiveTab(doc.key)}
                className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
              >
                <div className={styles.tabContent}>
                  <span className={styles.tabTitle}>{doc.title}</span>
                  {isComplete ? (
                    <FiCheckCircle className={styles.iconSuccess} size={16} />
                  ) : hasError ? (
                    <FiAlertCircle className={styles.iconError} size={16} />
                  ) : (
                    <FiClock className={styles.iconPending} size={16} />
                  )}
                </div>
                {isActive && <div className={styles.activeIndicator} />}
              </button>

              {isActive && (
                <section className={styles.viewer}>
                  <header className={styles.viewerHeader}>
                    <h4 className={styles.viewerTitle}>{doc.title}</h4>
                    <div className={styles.viewerInfo}>
                      <span>{doc.info}</span>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.helperLink}
                        >
                          {doc.linkText}
                          <FiExternalLink size={12} className={styles.linkIcon} />
                        </a>
                      )}
                    </div>
                  </header>

                  {isPerfil ? (
                    <div className={styles.perfilContainer}>
                      <div className={styles.perfilGrid}>
                        <div className={styles.perfilDataRow}>
                          <div className={styles.perfilLabelContainer}>
                            <FiBriefcase className={styles.perfilIcon} />
                            <span className={styles.perfilLabel}>
                              Razón Social:
                            </span>
                          </div>
                          <span className={styles.perfilValue}>
                            {MOCK_PROFILE.razonSocial}
                          </span>
                        </div>
                        <div className={styles.perfilDataRow}>
                          <div className={styles.perfilLabelContainer}>
                            <FiCreditCard className={styles.perfilIcon} />
                            <span className={styles.perfilLabel}>CUIT:</span>
                          </div>
                          <span className={styles.perfilValue}>
                            {MOCK_PROFILE.cuit}
                          </span>
                        </div>
                        <div className={styles.perfilDataRow}>
                          <div className={styles.perfilLabelContainer}>
                            <FiMapPin className={styles.perfilIcon} />
                            <span className={styles.perfilLabel}>Domicilio:</span>
                          </div>
                          <span className={styles.perfilValue}>
                            {MOCK_PROFILE.direccion}
                          </span>
                        </div>
                        <div className={styles.perfilDataRow}>
                          <div className={styles.perfilLabelContainer}>
                            <FiPhone className={styles.perfilIcon} />
                            <span className={styles.perfilLabel}>Teléfono:</span>
                          </div>
                          <span className={styles.perfilValue}>
                            {MOCK_PROFILE.telefono}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : isSocios ? (
                    <div className={styles.sociosContainer}>
                      <FiUsers size={32} className={styles.sociosPlaceholderIcon} />
                      <div className={styles.sociosPlaceholderText}>
                        <p>Socios</p>
                        <span>Reservado para integrantes.</span>
                      </div>
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
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(doc.key, e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  )}
                </section>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
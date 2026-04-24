import React, { useState } from "react";
import { FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { CargaArchivos } from "../../../../ui";
import styles from "./DocumentosLegajo.module.css";

const DOCS_REQUERIDOS = [
  { key: "estatuto", title: "Estatuto Social", info: "Normas de la entidad." },
  {
    key: "balance",
    title: "Último Balance",
    info: "Certificado por contador.",
  },
  { key: "acta", title: "Acta de Autoridades", info: "Designación vigente." },
  { key: "poderes", title: "Poderes", info: "Copia de representación." },
];

export function DocumentosLegajo({
  archivos = {},
  onFileUpload,
  onFileRemove,
  intentoAvanzar = false,
}) {
  const [activeTab, setActiveTab] = useState(DOCS_REQUERIDOS[0].key);

  return (
    <div className={styles.workspace}>
      <h3 className={styles.sidebarTitle}>Requisitos</h3>
      {DOCS_REQUERIDOS.map((doc) => {
        const currentFile = archivos[doc.key];
        const hasError = intentoAvanzar && !currentFile;
        const isActive = activeTab === doc.key;

        return (
          <div key={doc.key} className={styles.docItem}>
            <button
              type="button"
              onClick={() => setActiveTab(doc.key)}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
            >
              <div className={styles.tabContent}>
                <span className={styles.tabTitle}>{doc.title}</span>
                {currentFile ? (
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
                  <p className={styles.viewerInfo}>
                    <strong>Requisito:</strong> {doc.info}
                  </p>
                </header>

                <div className={styles.dropzoneContainer}>
                  <CargaArchivos
                    title={doc.title}
                    hasError={intentoAvanzar && !currentFile}
                    file={
                      currentFile
                        ? { name: currentFile.name, size: currentFile.size }
                        : null
                    }
                    onClick={() =>
                      document.getElementById(`file-input-${doc.key}`).click()
                    }
                    onRemove={() => onFileRemove(doc.key)}
                  />
                  <input
                    type="file"
                    id={`file-input-${doc.key}`}
                    style={{ display: "none" }}
                    onChange={(e) => onFileUpload(doc.key, e.target.files[0])}
                  />
                </div>
              </section>
            )}
          </div>
        );
      })}
    </div>
  );
}

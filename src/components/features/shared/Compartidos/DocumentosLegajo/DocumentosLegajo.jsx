import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
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

export function DocumentosLegajo() {
  const { control, setValue, trigger } = useFormContext();
  const formValues = useWatch({ control });

  const [activeTab, setActiveTab] = useState(DOCS_REQUERIDOS[0].key);

  const handleFileUpload = async (key, file) => {
    setValue(key, file, { shouldValidate: true, shouldDirty: true });
    await trigger(key);
  };

  const handleFileRemove = (key) => {
    setValue(key, null, { shouldValidate: true, shouldDirty: true });
  };

  const activeDoc = DOCS_REQUERIDOS.find((doc) => doc.key === activeTab);
  const activeFile = formValues[activeTab];
  const hasGlobalError = formValues.intentoAvanzar;

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Requisitos</h3>
        <nav className={styles.tabList}>
          {DOCS_REQUERIDOS.map((doc) => {
            const currentFile = formValues[doc.key];
            const hasError = hasGlobalError && !currentFile;
            const isActive = activeTab === doc.key;

            return (
              <button
                key={doc.key}
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
            );
          })}
        </nav>
      </aside>

      {/* Visor Central - Dropzone */}
      <section className={styles.viewer}>
        <header className={styles.viewerHeader}>
          <h4 className={styles.viewerTitle}>{activeDoc.title}</h4>
          <p className={styles.viewerInfo}>
            <strong>Requisito:</strong> {activeDoc.info}
          </p>
        </header>

        <div className={styles.dropzoneContainer}>
          <CargaArchivos
            title={activeDoc.title}
            hasError={hasGlobalError && !activeFile}
            file={
              activeFile
                ? { name: activeFile.name, size: activeFile.size }
                : null
            }
            onClick={() =>
              document.getElementById(`file-input-${activeTab}`).click()
            }
            onRemove={() => handleFileRemove(activeTab)}
          />
          <input
            type="file"
            id={`file-input-${activeTab}`}
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(activeTab, e.target.files[0])}
          />
        </div>
      </section>
    </div>
  );
}

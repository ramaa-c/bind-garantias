import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FiFileText,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import { Button, CargaArchivos } from "../../../../ui";
import styles from "./ModalDocumentosEmpresa.module.css";
import { useEscape } from "../../../../../hooks/useEscape";

export const ModalDocumentosEmpresa = ({
  isOpen,
  onClose,
  archivos,
  onFileUpload,
  onFileRemove,
  intentoAvanzar,
}) => {
  const docs = [
    {
      key: "estatuto",
      title: "Estatuto Social",
      info: "Normas de la entidad.",
    },
    {
      key: "balance",
      title: "Último Balance",
      info: "Certificado por contador.",
    },
    { key: "acta", title: "Acta de Autoridades", info: "Designación vigente." },
    { key: "poderes", title: "Poderes", info: "Copia de representación." },
  ];

  const [activeTab, setActiveTab] = useState(docs[0].key);

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEscape(onClose, isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.modalContainer}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.btnClose}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <FiX size={20} />
        </button>

        <div className={styles.body}>
          <div className={styles.iconWrapper}>
            <FiFileText size={30} />
          </div>

          <h2 className={styles.title}>Documentación Legal</h2>
          <p className={styles.description}>
            Subí los archivos requeridos para validar la entidad.
          </p>

          <div className={styles.workspace}>
            <h3 className={styles.sidebarTitle}>Requisitos</h3>

            {docs.map((doc) => {
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
                        <FiCheckCircle
                          className={styles.iconSuccess}
                          size={16}
                        />
                      ) : hasError ? (
                        <FiAlertCircle className={styles.iconError} size={16} />
                      ) : (
                        <FiClock className={styles.iconPending} size={16} />
                      )}
                    </div>
                    {isActive && <div className={styles.activeIndicator} />}
                  </button>

                  {isActive && (
                    <div className={styles.viewer}>
                      <div className={styles.viewerHeader}>
                        <h4 className={styles.viewerTitle}>{doc.title}</h4>
                        <p className={styles.viewerInfo}>
                          <strong>Requisito:</strong> {doc.info}
                        </p>
                      </div>

                      <div className={styles.dropzoneContainer}>
                        <CargaArchivos
                          title={doc.title}
                          hasError={hasError}
                          file={
                            currentFile
                              ? {
                                  name: currentFile.name,
                                  size:
                                    currentFile.formattedSize ||
                                    currentFile.size,
                                }
                              : null
                          }
                          onClick={() =>
                            document
                              .getElementById(`modal-file-${doc.key}`)
                              .click()
                          }
                          onRemove={() => onFileRemove(doc.key)}
                        />
                        <input
                          type="file"
                          id={`modal-file-${doc.key}`}
                          style={{ display: "none" }}
                          onChange={(e) =>
                            onFileUpload(doc.key, e.target.files[0])
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.modalFooter}>
            <Button type="button" variant="primary" onClick={onClose}>
              GUARDAR Y CERRAR
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

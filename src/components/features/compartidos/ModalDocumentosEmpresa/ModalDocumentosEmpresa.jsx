import React from "react";
import { FiFileText, FiX } from "react-icons/fi";
import { Acordeon, Button, CargaArchivos, Modal } from "../../../ui";
import styles from "./ModalDocumentosEmpresa.module.css";

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName={styles.overlay}
      modalClassName={styles.modalContainer}
      hideCloseButton={true}
    >
      <button
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

        <div className={styles.formSection}>
          {docs.map((doc) => (
            /* ---Wrapper --- */
            <div key={doc.key} className={styles.accordionCard}>
              <Acordeon
                title={doc.title}
                status={
                  archivos[doc.key]
                    ? "check"
                    : intentoAvanzar
                      ? "alert"
                      : "warn"
                }
              >
                <div className={styles.documentRow}>
                  <div className={styles.docInfoBox}>
                    <strong>Requisito:</strong> {doc.info}
                  </div>
                  <div className={styles.dropzoneWrapper}>
                    <CargaArchivos
                      title={doc.title}
                      hasError={intentoAvanzar && !archivos[doc.key]}
                      file={
                        archivos[doc.key]
                          ? {
                              name: archivos[doc.key].name,
                              size: archivos[doc.key].formattedSize,
                            }
                          : null
                      }
                      onClick={() =>
                        document
                          .getElementById(`file-input-${doc.key}`)
                          .click()
                      }
                      onRemove={() => onFileRemove(doc.key)}
                    />
                    <input
                      type="file"
                      id={`file-input-${doc.key}`}
                      style={{ display: "none" }}
                      onChange={(e) =>
                        onFileUpload(doc.key, e.target.files[0])
                      }
                    />
                  </div>
                </div>
              </Acordeon>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <Button variant="primary" onClick={onClose}>
            GUARDAR Y CERRAR
          </Button>
        </div>
      </div>
    </Modal>
  );
};

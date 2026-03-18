import React from "react";
import { Modal, Acordeon, Button, Alert, CargaArchivos } from "../../../ui";
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
    { key: "estatuto", title: "Estatuto Social", info: "Normas de la entidad." },
    { key: "balance", title: "Último Balance", info: "Certificado por contador." },
    { key: "acta", title: "Acta de Autoridades", info: "Designación vigente." },
    { key: "poderes", title: "Poderes", info: "Copia de representación." },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Documentación Legal" maxWidth="750px">
      <div className={styles.modalBody}>
        {docs.map((doc) => (
          <Acordeon 
            key={doc.key} 
            title={doc.title} 
            status={archivos[doc.key] ? "check" : (intentoAvanzar ? "alert" : "warn")}
          >
            <div className={styles.documentRow}>
              <div className={styles.dropzoneWrapper}>
                <CargaArchivos
                  title={doc.title}
                  hasError={intentoAvanzar && !archivos[doc.key]}
                  file={archivos[doc.key] ? { 
                    name: archivos[doc.key].name, 
                    size: archivos[doc.key].formattedSize 
                  } : null}
                  onClick={() => document.getElementById(`file-input-${doc.key}`).click()}
                  onRemove={() => onFileRemove(doc.key)}
                />
                <input 
                  type="file" 
                  id={`file-input-${doc.key}`} 
                  style={{ display: "none" }} 
                  onChange={(e) => onFileUpload(doc.key, e.target.files[0])} 
                />
              </div>
              <div className={styles.docInfoBox}>{doc.info}</div>
            </div>
          </Acordeon>
        ))}
        <Button variant="primary" onClick={onClose} className={styles.tallButton}>
          VOLVER
        </Button>
      </div>
    </Modal>
  );
};
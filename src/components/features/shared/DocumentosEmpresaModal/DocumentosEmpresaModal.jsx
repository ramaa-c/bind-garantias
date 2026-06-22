import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiFileText,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiLoader,
} from "react-icons/fi";
import { Button } from "../../../ui/Button/Button";
import { CargaArchivos } from "../../../ui/CargaArchivos/CargaArchivos";
import styles from "./DocumentosEmpresaModal.module.css";
import { useEscape } from "../../../../hooks/useEscape";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { toast } from "sonner";

export const DocumentosEmpresaModal = ({
  isOpen,
  onClose,
  archivos,
  onFileUpload,
  onFileRemove,
  intentoAvanzar,
  socioId,
  archivosBackend = [],
  onArchivosBackendChange,
  requisitos,
}) => {
  const allDocs = [
    {
      key: "estatuto",
      title: "Estatuto Social",
      info: "Normas constitutivas de la entidad legal.",
    },
    {
      key: "eecc",
      title: "Estados Contables (EECC)",
      info: "Estados contables auditados de los últimos ejercicios.",
    },
    {
      key: "balance",
      title: "Balance de Sumas y Saldos",
      info: "Último balance de la empresa firmado por contador público.",
    },
    {
      key: "ddjjIva",
      title: "Declaración Jurada de IVA",
      info: "Declaración jurada de IVA y su constancia de presentación.",
    },
    {
      key: "poderes",
      title: "Poderes",
      info: "Copia de representación legal para firmantes.",
    },
    {
      key: "certificadoPyme",
      title: "Certificado PyME",
      info: "Certificado oficial emitido por el Ministerio de Producción / AFIP.",
    },
    {
      key: "actaDesignacion",
      title: "Acta de Designación de Autoridades",
      info: "Designación de autoridades vigente o declaración jurada equivalente.",
    },
    {
      key: "actaSocios",
      title: "Acta de Reunión de Socios",
      info: "Acta de última reunión de socios o asamblea.",
    },
    {
      key: "f1272",
      title: "Formulario F1272",
      info: "Formulario de declaración de PyME ante la AFIP.",
    },
    {
      key: "ddjjGanancias",
      title: "DDJJ de Ganancias",
      info: "Declaración jurada de Ganancias presentada ante AFIP.",
    },
    {
      key: "manifestacionBienes",
      title: "Manifestación de Bienes",
      info: "Manifestación de bienes o DDJJ de Bienes Personales.",
    },
    {
      key: "constanciaMonotributo",
      title: "Constancia de Monotributo",
      info: "Constancia de opción al Monotributo de AFIP.",
    },
    {
      key: "cartasDocumento",
      title: "Cartas Documento",
      info: "Cartas documento operativas relacionadas.",
    },
    {
      key: "otrosDocumentos",
      title: "Otros Documentos",
      info: "Cualquier otra documentación de respaldo del legajo.",
    },
  ];

  const docs = allDocs.filter(({ key }) => {
    const configVal = requisitos?.documentos?.[key];
    return configVal !== 0; // 0 = no mostrar
  });

  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (
      docs.length > 0 &&
      (!activeTab || !docs.some((d) => d.key === activeTab))
    ) {
      setActiveTab(docs[0].key);
    }
  }, [docs, activeTab]);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKeys, setUploadingKeys] = useState({});

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEscape(onClose, isOpen);

  const handleGuardarYCerrar = async () => {
    if (!socioId) {
      onClose();
      return;
    }

    setIsSaving(true);
    let errores = 0;

    for (const doc of docs) {
      const file = archivos[doc.key];
      if (file && file instanceof File && !file._uploaded) {
        try {
          setUploadingKeys((prev) => ({ ...prev, [doc.key]: true }));
          const resultado = await socioArchivoService.subirOActualizar(
            socioId,
            file,
            doc.key,
            archivosBackend,
            doc.title,
          );
          const newFile = new File([file], file.name, { type: file.type });
          newFile._uploaded = true;
          newFile._backendId = resultado?.socioarchivoid || resultado?.id;
          if (onFileUpload) {
            onFileUpload(doc.key, newFile);
          }

          if (onArchivosBackendChange && resultado) {
            onArchivosBackendChange((prev) => {
              const tipoId = socioArchivoService.getTipoDocumentoId(doc.key);
              const filtered = prev.filter(
                (a) => a.tipodocumentoarchivoid !== tipoId,
              );
              return [...filtered, resultado];
            });
          }
        } catch (err) {
          console.error(`Error subiendo ${doc.key}:`, err);
          errores++;
        } finally {
          setUploadingKeys((prev) => ({ ...prev, [doc.key]: false }));
        }
      }
    }

    setIsSaving(false);

    if (errores > 0) {
      toast.error("Error al guardar", {
        description: `No se pudieron subir ${errores} archivo(s). Reintentá más tarde.`,
      });
    } else {
      toast.success("Documentos guardados", {
        description: "Los archivos fueron guardados correctamente.",
      });
    }

    onClose();
  };

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
              const isUploading = uploadingKeys[doc.key];

              return (
                <div key={doc.key} className={styles.docItem}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(doc.key)}
                    className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
                  >
                    <div className={styles.tabContent}>
                      <span className={styles.tabTitle}>{doc.title}</span>
                      {isUploading ? (
                        <FiLoader
                          className={styles.iconPending}
                          size={16}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : currentFile ? (
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
                          className={styles.dropzoneTaller}
                          title={doc.title}
                          hasError={hasError}
                          file={
                            currentFile
                              ? {
                                  name: currentFile.name,
                                  size:
                                    currentFile.formattedSize ||
                                    currentFile.size,
                                  vialufe: currentFile.vialufe || "0",
                                }
                              : null
                          }
                          onClick={() =>
                            document
                              .getElementById(`modal-file-${doc.key}`)
                              .click()
                          }
                          onEdit={() =>
                            document
                              .getElementById(`modal-file-${doc.key}`)
                              .click()
                          }
                          onDrop={(e) => {
                            if (e.dataTransfer.files?.[0]) {
                              onFileUpload(doc.key, e.dataTransfer.files[0]);
                            }
                          }}
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
            <Button
              type="button"
              variant="primary"
              onClick={handleGuardarYCerrar}
              isLoading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? "GUARDANDO..." : "GUARDAR Y CERRAR"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

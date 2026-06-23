import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useFormContext, useWatch, useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRequisitos } from "../../../../hooks/useRequisitos";
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
  FiUser,
  FiMail,
  FiPercent,
  FiChevronDown,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiSearch,
  FiSmartphone,
  FiMap,
} from "react-icons/fi";
import { toast } from "sonner";
import {
  CargaArchivos,
  Button,
  Modal,
  SelectSocio,
  InputSocioMasked,
  BuscadorCuit,
} from "../../../ui";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { tercerosService } from "../../../../services/tercerosService";
import { sociosService } from "../../../../services/sociosService";
import { usuarioService } from "../../../../services/usuarioService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { afipService } from "../../../../services/afipService";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { useObtenerTerceros } from "../../../../hooks/useTerceros";
import styles from "./DocumentosLegajo.module.css";
import {
  procesarArchivo,
  normalizarTexto,
  formatBase64Size,
} from "../../../../utils/fileUtils";

const ESTRUCTURA_LEGAJO = [
  {
    category: "Empresa",
    key: "perfil",
    title: "Perfil corporativo",
    info: "Datos identificatorios registrados en la plataforma.",
  },
  {
    category: "Documentación",
    key: "estatuto",
    title: "Estatuto Social",
    info: "Normas constitutivas de la entidad legal.",
  },
  {
    category: "Documentación",
    key: "eecc",
    title: "Estados Contables (EECC)",
    info: "Estados contables auditados de los últimos ejercicios.",
  },
  {
    category: "Documentación",
    key: "balance",
    title: "Balance de Sumas y Saldos",
    info: "Cargá o visualizá el último balance de tu empresa firmado por contador público.",
  },
  {
    category: "Documentación",
    key: "ddjjIva",
    title: "Declaración Jurada de IVA",
    info: "Declaración jurada de IVA y su constancia de presentación.",
  },
  {
    category: "Documentación",
    key: "poderes",
    title: "Poderes",
    info: "Documento que autoriza a un representante legal.",
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
    key: "actaDesignacion",
    title: "Acta de Designación de Autoridades",
    info: "Designación de autoridades vigente o declaración jurada equivalente.",
  },
  {
    category: "Documentación",
    key: "actaSocios",
    title: "Acta de Reunión de Socios",
    info: "Acta de última reunión de socios o asamblea.",
  },
  {
    category: "Documentación",
    key: "f1272",
    title: "Formulario F1272",
    info: "Formulario de declaración de PyME ante la AFIP.",
  },
  {
    category: "Documentación",
    key: "ddjjGanancias",
    title: "DDJJ de Ganancias",
    info: "Declaración jurada de Ganancias presentada ante AFIP.",
  },
  {
    category: "Documentación",
    key: "manifestacionBienes",
    title: "Manifestación de Bienes",
    info: "Manifestación de bienes o DDJJ de Bienes Personales.",
  },
  {
    category: "Documentación",
    key: "constanciaMonotributo",
    title: "Constancia de Monotributo",
    info: "Constancia de opción al Monotributo de AFIP.",
  },
  {
    category: "Documentación",
    key: "cartasDocumento",
    title: "Cartas Documento",
    info: "Cargá o visualizá las cartas documento vinculadas a la empresa.",
  },
  {
    category: "Documentación",
    key: "otrosDocumentos",
    title: "Otros documentos",
    info: "Adjuntá cualquier otro documento que consideres necesario.",
  },
];

export function DocumentosLegajo() {
  const { control, setValue } = useFormContext();
  const formValues = useWatch({ control });
  const { intentoAvanzar } = formValues;
  const queryClient = useQueryClient();

  const {
    socioIdActivo,
    nombreEmpresa,
    cuitActivo,
    direccion,
    telefono,
    tipoPersonaId,
  } = useEmpresaActiva();

  const { cadenaSlug } = useParams();
  const cadenaId = Number(cadenaSlug) || 1;
  const { requisitos } = useRequisitos(cadenaId, tipoPersonaId, nombreEmpresa);

  const estructuraFiltrada = useMemo(() => {
    return ESTRUCTURA_LEGAJO.filter((doc) => {
      if (doc.key === "perfil") return true;
      const configVal = requisitos?.documentos?.[doc.key];
      return configVal !== 0; // 0 = no mostrar
    });
  }, [requisitos]);

  const [activeTab, setActiveTab] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeDoc = useMemo(() => {
    return (
      estructuraFiltrada.find((doc) => doc.key === activeTab) ||
      estructuraFiltrada[0]
    );
  }, [estructuraFiltrada, activeTab]);

  useEffect(() => {
    if (
      estructuraFiltrada.length > 0 &&
      (!activeTab || !estructuraFiltrada.some((t) => t.key === activeTab))
    ) {
      setActiveTab(estructuraFiltrada[0].key);
    }
  }, [estructuraFiltrada, activeTab]);

  const [archivosBackend, setArchivosBackend] = useState([]);
  const [uploadingKey, setUploadingKey] = useState(null);

  const cargarArchivosExistentes = async () => {
    if (!socioIdActivo) return;
    try {
      const archivos = await socioArchivoService.obtenerArchivos(socioIdActivo);
      if (Array.isArray(archivos)) {
        setArchivosBackend(archivos);

        archivos.forEach((arch) => {
          const tipoId = arch.tipodocumentoarchivoid;
          const key = Object.keys(socioArchivoService.TIPO_DOCUMENTO_MAP).find(
            (k) => socioArchivoService.TIPO_DOCUMENTO_MAP[k] === tipoId,
          );

          if (
            key &&
            Object.keys(socioArchivoService.TIPO_DOCUMENTO_MAP).includes(key)
          ) {
            setValue(
              key,
              {
                name: arch.nombrearchivo,
                size: arch.contenido
                  ? formatBase64Size(arch.contenido)
                  : "Disponible",
                _uploaded: true,
                _backendId: arch.socioarchivoid,
                _tipodocumentoarchivoid: tipoId,
                vialufe: arch.vialufe || arch.Vialufe || "0",
              },
              { shouldValidate: true },
            );
            setValue(`${key}_backendId`, arch.socioarchivoid);
          }
        });
      }
    } catch (err) {
      console.error("Error cargando archivos del legajo:", err);
    }
  };

  useEffect(() => {
    cargarArchivosExistentes();
  }, [socioIdActivo, setValue]);

  useEffect(() => {
    const handleResize = () => {
      if (
        window.innerWidth > 768 &&
        !activeTab &&
        estructuraFiltrada.length > 0
      ) {
        setActiveTab(estructuraFiltrada[0].key);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, estructuraFiltrada]);

  const handleFileUpload = async (key, file, docTitle) => {
    if (file instanceof File) {
      file._uploaded = false;
      setValue(key, file, { shouldValidate: true, shouldDirty: true });

      if (!socioIdActivo) {
        toast.error("No se pudo identificar la empresa activa.");
        return;
      }

      const toastId = toast.loading(`Subiendo ${docTitle}...`);
      try {
        const specificId = formValues[`${key}_backendId`];
        const resultado = await socioArchivoService.subirOActualizar(
          socioIdActivo,
          file,
          key,
          archivosBackend,
          docTitle,
          specificId
        );

        if (resultado) {
          file._uploaded = true;
          file._backendId = resultado.socioarchivoid || resultado.id;
          setValue(key, file);
          setValue(`${key}_backendId`, file._backendId);
          await cargarArchivosExistentes();
          
          queryClient.invalidateQueries({
            queryKey: ["socioArchivos", socioIdActivo],
          });
          queryClient.invalidateQueries({
            queryKey: ["socioLegajoCompleto", socioIdActivo],
          });

          toast.success("Documento subido exitosamente", { id: toastId });
        }
      } catch (error) {
        console.error("Fallo al subir el archivo:", error);
        toast.error("Error al subir el documento. Por favor, reintente.", { id: toastId });
      }
    }
  };
  const handleFileRemove = (key) =>
    setValue(key, null, { shouldValidate: true, shouldDirty: true });
  const renderViewer = (doc) => {
    if (!doc) return null;
    const isPerfil = doc.key === "perfil";
    const currentFile = formValues[doc.key];
    const isRequired = requisitos?.documentos?.[doc.key] === 1;
    const hasError = intentoAvanzar && !isPerfil && isRequired && !currentFile;

    return (
      <section className={styles.viewer}>
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

        {isPerfil ? (
          <div className={styles.perfilGrid}>
            <div className={`${styles.perfilChip} ${styles.glassCard}`}>
              <div className={styles.perfilChipHeader}>
                <FiBriefcase className={styles.perfilChipIcon} size={20} />
                <span className={styles.perfilChipLabel}>Razón Social</span>
              </div>
              <span className={styles.perfilChipValue}>
                {nombreEmpresa || "—"}
              </span>
            </div>
            <div className={`${styles.perfilChip} ${styles.glassCard}`}>
              <div className={styles.perfilChipHeader}>
                <FiCreditCard className={styles.perfilChipIcon} size={20} />
                <span className={styles.perfilChipLabel}>CUIT</span>
              </div>
              <span className={styles.perfilChipValue}>
                {cuitActivo || "—"}
              </span>
            </div>
            <div className={`${styles.perfilChip} ${styles.glassCard}`}>
              <div className={styles.perfilChipHeader}>
                <FiMapPin className={styles.perfilChipIcon} size={20} />
                <span className={styles.perfilChipLabel}>Domicilio</span>
              </div>
              <span className={styles.perfilChipValue}>{direccion || "—"}</span>
            </div>
            <div className={`${styles.perfilChip} ${styles.glassCard}`}>
              <div className={styles.perfilChipHeader}>
                <FiPhone className={styles.perfilChipIcon} size={20} />
                <span className={styles.perfilChipLabel}>Teléfono</span>
              </div>
              <span className={styles.perfilChipValue}>{telefono || "—"}</span>
            </div>
          </div>
        ) : (
          <div className={styles.dropzoneContainer}>
            <CargaArchivos
              title={doc.title}
              hasError={hasError}
              file={
                currentFile
                  ? {
                      name: currentFile.name,
                      size: currentFile.size,
                      vialufe: currentFile.vialufe || "0",
                    }
                  : null
              }
              onClick={() =>
                document.getElementById(`file-input-${doc.key}`).click()
              }
              onEdit={() =>
                document.getElementById(`file-input-${doc.key}`).click()
              }
              onDrop={(e) => {
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(doc.key, e.dataTransfer.files[0], doc.title);
                }
              }}
              onDelete={() => handleFileRemove(doc.key)}
              onView={() =>
                procesarArchivo(currentFile, archivosBackend, "view")
              }
              onDownload={() =>
                procesarArchivo(currentFile, archivosBackend, "download")
              }
            />
            <input
              id={`file-input-${doc.key}`}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(doc.key, e.target.files[0], doc.title);
                }
              }}
              accept="application/pdf"
            />
          </div>
        )}
      </section>
    );
  };

  if (!isMobile) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar}>
          {estructuraFiltrada.map((doc, index) => {
            const isNewCategory =
              index === 0 ||
              doc.category !== estructuraFiltrada[index - 1].category;
            const isPerfil = doc.key === "perfil";
            const currentFile = formValues[doc.key];
            const isComplete = isPerfil || !!currentFile;
            const isRequired = requisitos?.documentos?.[doc.key] === 1;
            const hasError =
              intentoAvanzar && !isPerfil && isRequired && !currentFile;
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
                  <div className={styles.tabTitleGroup}>
                    <span className={styles.tabTitle}>{doc.title}</span>
                    {!isPerfil &&
                      (isRequired ? (
                        <span
                          className={`${styles.reqBadge} ${styles.reqBadgeMandatory}`}
                        >
                          Obligatorio
                        </span>
                      ) : (
                        <span
                          className={`${styles.reqBadge} ${styles.reqBadgeOptional}`}
                        >
                          Opcional
                        </span>
                      ))}
                  </div>
                  <span
                    className={`${styles.statusDot} ${isComplete ? styles.dotGreen : hasError ? styles.dotRed : styles.dotGray}`}
                  />
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className={styles.viewerContainer}>{renderViewer(activeDoc)}</div>
      </div>
    );
  }

  // Layout Mobile (Accordion vertical)
  return (
    <div className={styles.workspaceMobile}>
      {estructuraFiltrada.map((doc, index) => {
        const isNewCategory =
          index === 0 ||
          doc.category !== estructuraFiltrada[index - 1].category;
        const isPerfil = doc.key === "perfil";
        const currentFile = formValues[doc.key];
        const isComplete = isPerfil || !!currentFile;
        const isRequired = requisitos?.documentos?.[doc.key] === 1;
        const hasError =
          intentoAvanzar && !isPerfil && isRequired && !currentFile;
        const isActive = activeTab === doc.key;

        return (
          <React.Fragment key={doc.key}>
            {isNewCategory && (
              <p className={styles.categoryLabel}>{doc.category}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveTab((prev) => (prev === doc.key ? null : doc.key));
              }}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
            >
              {isActive && <span className={styles.activeBar} />}
              <div className={styles.tabTitleGroup}>
                <span className={styles.tabTitle}>{doc.title}</span>
                {!isPerfil &&
                  (isRequired ? (
                    <span
                      className={`${styles.reqBadge} ${styles.reqBadgeMandatory}`}
                    >
                      Obligatorio
                    </span>
                  ) : (
                    <span
                      className={`${styles.reqBadge} ${styles.reqBadgeOptional}`}
                    >
                      Opcional
                    </span>
                  ))}
              </div>
              <span
                className={`${styles.statusDot} ${isComplete ? styles.dotGreen : hasError ? styles.dotRed : styles.dotGray}`}
              />
              <FiChevronDown
                className={styles.mobileChevron}
                style={{
                  transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  color: isActive ? "#fff" : "#aaa",
                  fontSize: "1.1rem",
                }}
              />
            </button>

            {isActive && renderViewer(doc)}
          </React.Fragment>
        );
      })}
    </div>
  );
}

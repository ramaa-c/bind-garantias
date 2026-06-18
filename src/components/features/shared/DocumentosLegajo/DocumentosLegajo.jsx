import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useFormContext, useWatch, useForm, Controller } from "react-hook-form";
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
import { procesarArchivo, normalizarTexto, formatBase64Size } from "../../../../utils/fileUtils";

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
    key: "balance",
    title: "Último Balance",
    info: "Cargá o visualizá el último balance de tu empresa firmado por contador público.",
  },
  {
    category: "Documentación",
    key: "acta",
    title: "Acta de Autoridades / DDJJ IVA",
    info: "Designación de autoridades vigente o declaración jurada equivalente.",
  },
  {
    category: "Documentación",
    key: "cartasDocumento",
    title: "Cartas Documento",
    info: "Cargá o visualizá las cartas documento vinculadas a la empresa.",
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
    key: "otrosDocumentos",
    title: "Otros documentos",
    info: "Adjuntá cualquier otro documento que consideres necesario.",
  },
];

export function DocumentosLegajo() {
  const { control, setValue } = useFormContext();
  const formValues = useWatch({ control });
  const { intentoAvanzar } = formValues;

  const { cadenaSlug } = useParams();
  const cadenaId = Number(cadenaSlug) || 1;
  const { requisitos } = useRequisitos(cadenaId);

  const estructuraFiltrada = useMemo(() => {
    return ESTRUCTURA_LEGAJO.filter(doc => {
      if (doc.key === "perfil") return true;
      const configVal = requisitos?.documentos?.[doc.key];
      return configVal !== 0; // 0 = no mostrar
    });
  }, [requisitos]);

  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (estructuraFiltrada.length > 0 && (!activeTab || !estructuraFiltrada.some(t => t.key === activeTab))) {
      setActiveTab(estructuraFiltrada[0].key);
    }
  }, [estructuraFiltrada, activeTab]);

  const { socioIdActivo, nombreEmpresa, cuitActivo, direccion, telefono } =
    useEmpresaActiva();

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
            (k) => socioArchivoService.TIPO_DOCUMENTO_MAP[k] === tipoId
          );

          if (key && ["estatuto", "balance", "acta", "cartasDocumento", "poderes", "certificadoPyme", "otrosDocumentos"].includes(key)) {
            setValue(
              key,
              {
                name: arch.nombrearchivo,
                size: arch.contenido ? formatBase64Size(arch.contenido) : "Disponible",
                _uploaded: true,
                _backendId: arch.socioarchivoid,
                _tipodocumentoarchivoid: tipoId,
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
      if (window.innerWidth > 768 && !activeTab && estructuraFiltrada.length > 0) {
        setActiveTab(estructuraFiltrada[0].key);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, estructuraFiltrada]);

  const handleFileUpload = (key, file) => {
    if (file instanceof File) {
      file._uploaded = false;
      setValue(key, file, { shouldValidate: true, shouldDirty: true });
    }
  };
  const handleFileRemove = (key) =>
    setValue(key, null, { shouldValidate: true, shouldDirty: true });
  return (
    <div className={styles.workspace}>
      <div className={styles.sidebarBg} />
      {estructuraFiltrada.map((doc, index) => {
        const isNewCategory =
          index === 0 || doc.category !== estructuraFiltrada[index - 1].category;
        const isPerfil = doc.key === "perfil";
        const currentFile = formValues[doc.key];
        const isComplete = isPerfil || !!currentFile;
        const isRequired = requisitos?.documentos?.[doc.key] === 1;
        const hasError = intentoAvanzar && !isPerfil && isRequired && !currentFile;
        const isActive = activeTab === doc.key;

        return (
          <React.Fragment key={doc.key}>
            {isNewCategory && (
              <p className={styles.categoryLabel}>{doc.category}</p>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setActiveTab((prev) => (prev === doc.key ? null : doc.key));
                } else {
                  setActiveTab(doc.key);
                }
              }}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
            >
              {isActive && <span className={styles.activeBar} />}
              <span className={styles.tabTitle}>{doc.title}</span>
              <span
                className={`${styles.statusDot} ${isComplete ? styles.dotGreen : hasError ? styles.dotRed : styles.dotGray}`}
              />
              <FiChevronDown
                className={styles.mobileChevron}
                style={{
                  transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  color: isActive ? "#fff" : "#aaa",
                  fontSize: "1.1rem"
                }}
              />
            </button>

            {isActive && (
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
                    <div className={styles.perfilChip}>
                      <div className={styles.perfilChipHeader}>
                        <FiBriefcase className={styles.perfilChipIcon} size={20} />
                        <span className={styles.perfilChipLabel}>Razón Social</span>
                      </div>
                      <span className={styles.perfilChipValue}>
                        {nombreEmpresa || "—"}
                      </span>
                    </div>
                    <div className={styles.perfilChip}>
                      <div className={styles.perfilChipHeader}>
                        <FiCreditCard className={styles.perfilChipIcon} size={20} />
                        <span className={styles.perfilChipLabel}>CUIT</span>
                      </div>
                      <span className={styles.perfilChipValue}>
                        {cuitActivo || "—"}
                      </span>
                    </div>
                    <div className={styles.perfilChip}>
                      <div className={styles.perfilChipHeader}>
                        <FiMapPin className={styles.perfilChipIcon} size={20} />
                        <span className={styles.perfilChipLabel}>Domicilio</span>
                      </div>
                      <span className={styles.perfilChipValue}>
                        {direccion || "—"}
                      </span>
                    </div>
                    <div className={styles.perfilChip}>
                      <div className={styles.perfilChipHeader}>
                        <FiPhone className={styles.perfilChipIcon} size={20} />
                        <span className={styles.perfilChipLabel}>Teléfono</span>
                      </div>
                      <span className={styles.perfilChipValue}>
                        {telefono || "—"}
                      </span>
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
                      onEdit={() =>
                        document.getElementById(`file-input-${doc.key}`).click()
                      }
                      onDelete={() => handleFileRemove(doc.key)}
                      onView={() => procesarArchivo(currentFile, archivosBackend, "view")}
                      onDownload={() => procesarArchivo(currentFile, archivosBackend, "download")}
                    />
                    <input
                      id={`file-input-${doc.key}`}
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(doc.key, e.target.files[0]);
                        }
                      }}
                      accept="application/pdf"
                    />
                  </div>
                )}
              </section>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

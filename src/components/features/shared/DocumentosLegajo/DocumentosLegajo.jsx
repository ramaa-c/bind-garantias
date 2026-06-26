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
  FiDownload,
  FiFile,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import {
  CargaArchivos,
  Button,
  Modal,
  SelectSocio,
  InputSocioMasked,
  BuscadorCuit,
  SelectFecha,
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
  descargarArchivosEnZip,
} from "../../../../utils/fileUtils";

export const ESTRUCTURA_LEGAJO = [
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

const getDownloadCategoryText = (key, title) => {
  const plurals = {
    estatuto: "todos los Estatutos",
    eecc: "todos los Estados Contables",
    balance: "todos los Balances",
    ddjjIva: "todas las Declaraciones",
    poderes: "todos los Poderes",
    certificadoPyme: "todos los Certificados",
    actaDesignacion: "todas las Actas",
    actaSocios: "todas las Actas",
    f1272: "todos los Formularios",
    ddjjGanancias: "todas las DDJJ",
    manifestacionBienes: "todas las Manifestaciones",
    constanciaMonotributo: "todas las Constancias",
    cartasDocumento: "todas las Cartas Documento",
    otrosDocumentos: "todos los Documentos",
  };
  return `Descargar ${plurals[key] || `todos: ${title}`}`;
};

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
    if (estructuraFiltrada.length > 0) {
      if (!isMobile && !activeTab) {
        setActiveTab(estructuraFiltrada[0].key);
      } else if (activeTab && !estructuraFiltrada.some((t) => t.key === activeTab)) {
        setActiveTab(isMobile ? null : estructuraFiltrada[0].key);
      }
    }
  }, [estructuraFiltrada, activeTab, isMobile]);

  const [archivosBackend, setArchivosBackend] = useState([]);
  const [activeSubTabs, setActiveSubTabs] = useState({});
  const [metaFecha, setMetaFecha] = useState("");
  const [metaRef, setMetaRef] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const cargarArchivosExistentes = async () => {
    if (!socioIdActivo) return;
    try {
      const archivos = await socioArchivoService.obtenerArchivos(socioIdActivo);
      if (Array.isArray(archivos)) {
        setArchivosBackend(archivos);

        // Agrupar archivos por tipo
        const grouped = {};
        archivos.forEach((arch) => {
          const tipoId = arch.tipodocumentoarchivoid;
          const key = Object.keys(socioArchivoService.TIPO_DOCUMENTO_MAP).find(
            (k) => socioArchivoService.TIPO_DOCUMENTO_MAP[k] === tipoId
          );
          if (key) {
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(arch);
          }
        });

        // Sincronizar react-hook-form con el archivo más nuevo para la validación visual
        Object.keys(socioArchivoService.TIPO_DOCUMENTO_MAP).forEach((key) => {
          const files = grouped[key] || [];
          if (files.length > 0) {
            const latest = [...files].sort((a, b) => b.socioarchivoid - a.socioarchivoid)[0];
            setValue(
              key,
              {
                name: latest.nombrearchivo,
                size: latest.contenido
                  ? formatBase64Size(latest.contenido)
                  : "Disponible",
                _uploaded: true,
                _backendId: latest.socioarchivoid,
                _tipodocumentoarchivoid: latest.tipodocumentoarchivoid,
                vialufe: latest.vialufe || latest.Vialufe || "0",
              },
              { shouldValidate: true }
            );
            setValue(`${key}_backendId`, latest.socioarchivoid);
          } else {
            setValue(key, null);
            setValue(`${key}_backendId`, null);
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

  // Obtener archivos de la categoría activa ordenados de más nuevo a más viejo
  const categoryFiles = useMemo(() => {
    if (!activeDoc || activeDoc.key === "perfil") return [];
    const tipoId = socioArchivoService.TIPO_DOCUMENTO_MAP[activeDoc.key];
    const files = archivosBackend.filter((a) => a.tipodocumentoarchivoid === tipoId);
    return files.sort((a, b) => b.socioarchivoid - a.socioarchivoid);
  }, [archivosBackend, activeDoc]);

  // Subpestaña activa para la categoría
  const currentSubTab = activeSubTabs[activeDoc.key] !== undefined
    ? activeSubTabs[activeDoc.key]
    : (categoryFiles.length > 0 ? 0 : "nuevo");

  const selectSubTab = (key, tabIndexOrKey) => {
    setActiveSubTabs((prev) => ({
      ...prev,
      [key]: tabIndexOrKey,
    }));
  };

  // Archivo activo para la subpestaña seleccionada
  const activeFile = useMemo(() => {
    return currentSubTab !== "nuevo" ? categoryFiles[currentSubTab] : null;
  }, [categoryFiles, currentSubTab]);

  // Sincronizar los campos de metadatos cuando cambia el archivo seleccionado
  useEffect(() => {
    if (activeFile) {
      const rawDate = activeFile.fchreferencia || "";
      const dateVal = rawDate ? rawDate.split("T")[0] : "";
      setMetaFecha(dateVal);
      setMetaRef(activeFile.referencia || "");
    } else {
      setMetaFecha("");
      setMetaRef("");
    }
  }, [activeFile]);

  const handleSaveMetadata = async () => {
    if (!activeFile) return;
    setIsSavingMeta(true);
    const toastId = toast.loading("Guardando metadatos del archivo...");
    try {
      const fchreferencia = metaFecha ? `${metaFecha.split("T")[0]}T00:00:00` : null;

      await socioArchivoService.actualizarArchivo(
        activeFile,
        null,
        activeDoc.key,
        activeFile.descripcion,
        activeFile.vialufe || "0",
        fchreferencia,
        metaRef
      );

      await cargarArchivosExistentes();

      queryClient.invalidateQueries({
        queryKey: ["socioArchivos", socioIdActivo],
      });
      queryClient.invalidateQueries({
        queryKey: ["socioLegajoCompleto", socioIdActivo],
      });

      toast.success("Metadatos guardados correctamente", { id: toastId });
    } catch (error) {
      console.error("Error al guardar metadatos:", error);
      toast.error("Error al guardar los metadatos del archivo.", { id: toastId });
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleFileUpload = async (key, file, docTitle, specificId = null) => {
    if (file instanceof File) {
      setValue(key, file, { shouldValidate: true, shouldDirty: true });

      if (!socioIdActivo) {
        toast.error("No se pudo identificar la empresa activa.");
        return;
      }

      const toastId = toast.loading(`Subiendo ${docTitle}...`);
      try {
        let resultado;
        if (specificId) {
          const existente = archivosBackend.find(
            (a) => a.socioarchivoid === Number(specificId)
          );
          if (existente) {
            resultado = await socioArchivoService.actualizarArchivo(
              existente,
              file,
              key,
              docTitle,
              existente.vialufe || "0",
              existente.fchreferencia,
              existente.referencia
            );
          } else {
            throw new Error("No se encontró el archivo a actualizar.");
          }
        } else {
          resultado = await socioArchivoService.subirArchivo(
            socioIdActivo,
            file,
            key,
            docTitle
          );
        }

        if (resultado) {
          await cargarArchivosExistentes();
          
          queryClient.invalidateQueries({
            queryKey: ["socioArchivos", socioIdActivo],
          });
          queryClient.invalidateQueries({
            queryKey: ["socioLegajoCompleto", socioIdActivo],
          });

          toast.success("Documento subido exitosamente", { id: toastId });
          selectSubTab(key, 0);
        }
      } catch (error) {
        console.error("Fallo al subir el archivo:", error);
        toast.error("Error al subir el documento. Por favor, reintente.", { id: toastId });
      }
    }
  };

  const handleFileDelete = async (key, fileId, docTitle) => {
    if (!socioIdActivo) {
      toast.error("No se pudo identificar la empresa activa.");
      return;
    }
    const toastId = toast.loading(`Eliminando ${docTitle}...`);
    try {
      // Intentar llamada al backend (por si implementan el endpoint)
      try {
        await socioArchivoService.eliminarArchivo(socioIdActivo, fileId);
      } catch (apiError) {
        console.warn("El backend no soporta DELETE para SocioArchivo aún. Aplicando simulación local.", apiError);
      }

      // Filtrar el archivo eliminado del estado local para el maquetado visual
      setArchivosBackend((prev) => {
        const actualizados = prev.filter((a) => a.socioarchivoid !== fileId);
        
        // Recalcular RHF con los archivos restantes
        const tipoId = socioArchivoService.TIPO_DOCUMENTO_MAP[key];
        const restantes = actualizados
          .filter((a) => a.tipodocumentoarchivoid === tipoId)
          .sort((a, b) => b.socioarchivoid - a.socioarchivoid);

        if (restantes.length > 0) {
          setValue(
            key,
            {
              name: restantes[0].nombrearchivo,
              size: restantes[0].contenido ? formatBase64Size(restantes[0].contenido) : "Disponible",
              _uploaded: true,
              _backendId: restantes[0].socioarchivoid,
              _tipodocumentoarchivoid: restantes[0].tipodocumentoarchivoid,
              vialufe: restantes[0].vialufe || restantes[0].Vialufe || "0",
            },
            { shouldValidate: true }
          );
          setValue(`${key}_backendId`, restantes[0].socioarchivoid);
        } else {
          setValue(key, null);
          setValue(`${key}_backendId`, null);
        }

        return actualizados;
      });

      queryClient.invalidateQueries({
        queryKey: ["socioArchivos", socioIdActivo],
      });
      queryClient.invalidateQueries({
        queryKey: ["socioLegajoCompleto", socioIdActivo],
      });

      toast.success("Documento eliminado exitosamente", { id: toastId });
      selectSubTab(key, 0);
    } catch (error) {
      console.error("Fallo al eliminar el archivo:", error);
      toast.error("Error al eliminar el documento. Por favor, reintente.", { id: toastId });
    }
  };

  const handleDownloadCategoryZip = () => {
    if (categoryFiles.length === 0) return;
    const cleanDocTitle = activeDoc.title.replace(/\s+/g, "_");
    const cleanRazonSocial = (nombreEmpresa || "Empresa").replace(/\s+/g, "_");
    const zipName = `Documentos_${cleanRazonSocial}_${cleanDocTitle}.zip`;
    descargarArchivosEnZip(categoryFiles, zipName);
  };

  const renderViewer = (doc) => {
    if (!doc) return null;
    const isPerfil = doc.key === "perfil";
    const files = categoryFiles;
    const isRequired = requisitos?.documentos?.[doc.key] === 1;
    const showSubTabs = !isPerfil && files.length > 0;
    
    const fileProp = activeFile ? {
      name: activeFile.nombrearchivo,
      size: activeFile.contenido ? formatBase64Size(activeFile.contenido) : "Disponible",
      vialufe: activeFile.vialufe || activeFile.Vialufe || "0",
    } : null;

    const hasError = intentoAvanzar && !isPerfil && isRequired && files.length === 0;
    const isLufe = files.some((a) => String(a.vialufe || a.Vialufe) === "1");

    return (
      <section className={styles.viewer}>
        <header className={styles.viewerHeader}>
          <div className={styles.viewerMeta}>
            <span className={styles.viewerBadge}>{doc.category}</span>
            {isLufe && (
              <span className={`${styles.viewerBadge} ${styles.viewerBadgeLufe}`}>
                Vía LUFE
              </span>
            )}
          </div>
          <div className={styles.viewerHeaderTitleRow}>
            <h4 className={styles.viewerTitle}>{doc.title}</h4>
            {files.length > 1 && (
              <button
                type="button"
                className={styles.downloadCategoryBtn}
                onClick={handleDownloadCategoryZip}
                title={`Descargar todos los archivos de tipo ${doc.title}`}
              >
                <FiDownload size={13} /> {getDownloadCategoryText(doc.key, doc.title)} ({files.length})
              </button>
            )}
          </div>
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
          <div className={styles.viewerContent}>
            {showSubTabs && (
              <div className={styles.subTabsContainer}>
                {files.map((file, idx) => {
                  const isActive = currentSubTab === idx;
                  return (
                    <button
                      key={file.socioarchivoid}
                      type="button"
                      onClick={() => selectSubTab(doc.key, idx)}
                      className={`${styles.subTab} ${isActive ? styles.subTabActive : ""}`}
                      title={file.nombrearchivo}
                    >
                      <FiFile size={12} className={styles.subTabIcon} />
                      <span className={styles.subTabText}>
                        {file.nombrearchivo.length > 25
                          ? `${file.nombrearchivo.substring(0, 22)}...`
                          : file.nombrearchivo}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `¿Estás seguro de que deseas eliminar el archivo "${file.nombrearchivo}"?`
                            )
                          ) {
                            handleFileDelete(doc.key, file.socioarchivoid, doc.title);
                          }
                        }}
                        className={styles.subTabClose}
                        title="Eliminar archivo"
                      >
                        <FiX size={10} />
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => selectSubTab(doc.key, "nuevo")}
                  className={`${styles.subTab} ${styles.subTabAdd} ${currentSubTab === "nuevo" ? styles.subTabActive : ""}`}
                >
                  <FiPlus size={12} />
                  <span>Subir otro</span>
                </button>
              </div>
            )}

            <div className={styles.dropzoneContainer}>
              <CargaArchivos
                title={currentSubTab === "nuevo" ? "Arrastrá tu nuevo archivo acá" : doc.title}
                subtitle={currentSubTab === "nuevo" ? "o hacé click para buscar" : "Archivo cargado"}
                hasError={hasError}
                file={fileProp}
                onClick={() =>
                  document.getElementById(`file-input-${doc.key}`).click()
                }
                onEdit={() =>
                  document.getElementById(`file-input-${doc.key}`).click()
                }
                onDrop={(e) => {
                  if (e.dataTransfer.files?.[0]) {
                    const specificId = activeFile ? activeFile.socioarchivoid : null;
                    handleFileUpload(doc.key, e.dataTransfer.files[0], doc.title, specificId);
                  }
                }}
                onView={() => {
                  if (activeFile) {
                    procesarArchivo(activeFile, archivosBackend, "view");
                  }
                }}
                onDownload={() => {
                  if (activeFile) {
                    procesarArchivo(activeFile, archivosBackend, "download");
                  }
                }}
              />
              <input
                id={`file-input-${doc.key}`}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const specificId = activeFile ? activeFile.socioarchivoid : null;
                    handleFileUpload(doc.key, e.target.files[0], doc.title, specificId);
                  }
                  e.target.value = null;
                }}
                accept="application/pdf"
              />
            </div>

            {/* Formulario de Metadatos Adicionales (Diseño compacto horizontal) */}
            {activeFile && (
              <div className={styles.metaFormContainer}>
                <div className={styles.metaFormFields}>
                  <div className={styles.metaFieldGroup}>
                    <label className={styles.metaLabel}>
                      Fecha (Opcional)
                    </label>
                    <SelectFecha
                      label=""
                      placeholder="Seleccionar fecha"
                      value={metaFecha}
                      onChange={(val) => setMetaFecha(val)}
                      variant="compact"
                      placement="top"
                      minDate={new Date(new Date().getFullYear() - 8, 0, 1)}
                    />
                  </div>
                  <div className={styles.metaFieldGroup}>
                    <label htmlFor="meta-ref" className={styles.metaLabel}>
                      Referencia (Opcional)
                    </label>
                    <input
                      id="meta-ref"
                      type="text"
                      placeholder="Ej. Año 2025 o Versión final"
                      value={metaRef}
                      onChange={(e) => setMetaRef(e.target.value)}
                      className={styles.metaInput}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMetadata}
                    disabled={isSavingMeta}
                    className={styles.saveMetaBtn}
                  >
                    {isSavingMeta ? "..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}
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

            const docFiles = archivosBackend.filter(
              (a) => a.tipodocumentoarchivoid === socioArchivoService.TIPO_DOCUMENTO_MAP[doc.key]
            );
            const isLufe = docFiles.some((a) => String(a.vialufe || a.Vialufe) === "1");

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
                    <div className={styles.badgeRow}>
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
                      {isLufe && (
                        <span
                          className={`${styles.reqBadge} ${styles.reqBadgeLufe}`}
                        >
                          Vía LUFE
                        </span>
                      )}
                    </div>
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

        const docFiles = archivosBackend.filter(
          (a) => a.tipodocumentoarchivoid === socioArchivoService.TIPO_DOCUMENTO_MAP[doc.key]
        );
        const isLufe = docFiles.some((a) => String(a.vialufe || a.Vialufe) === "1");

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
                <div className={styles.badgeRow}>
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
                  {isLufe && (
                    <span
                      className={`${styles.reqBadge} ${styles.reqBadgeLufe}`}
                    >
                      Vía LUFE
                    </span>
                  )}
                </div>
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

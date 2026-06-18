import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import {
  useFormContext,
  useFormState,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiMail,
} from "react-icons/fi";
import { toast } from "sonner";
import { Button, InputFlotante, InputSocioMasked } from "../../../ui";
import {
  DocumentosEmpresaModal,
  RepresentanteModal,
} from "../../../features";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { formatBase64Size } from "../../../../utils/fileUtils";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
import styles from "./Paso5Documentacion.module.css";

const DOC_ITEMS = [
  { key: "estatuto", label: "Estatuto" },
  { key: "balance", label: "Balance" },
  { key: "acta", label: "Acta / DDJJ IVA" },
  { key: "cartasDocumento", label: "Cartas Documento" },
  { key: "poderes", label: "Poderes" },
  { key: "certificadoPyme", label: "Certificado PyME" },
  { key: "otrosDocumentos", label: "Otros Documentos" },
];

const PersistenciaOculta = ({ register, socios = [], representantes = [] }) => (
  <div style={{ display: "none" }}>
    <input {...register("emailFacturacion")} />
    {socios.map((socio, i) => (
      <React.Fragment key={socio?.cuit || i}>
        <input {...register(`socios.${i}.email`)} />
        <input {...register(`socios.${i}.celular`)} />
        <input {...register(`socios.${i}.direccion`)} />
        <input {...register(`socios.${i}.provincia`)} />
        <input {...register(`socios.${i}.localidad`)} />
      </React.Fragment>
    ))}
    {representantes.map((rep, i) => (
      <React.Fragment key={rep?.id || i}>
        <input {...register(`representantes.${i}.cuit`)} />
        <input {...register(`representantes.${i}.nombre`)} />
        <input {...register(`representantes.${i}.rol`)} />
        <input {...register(`representantes.${i}.email`)} />
        <input {...register(`representantes.${i}.celular`)} />
      </React.Fragment>
    ))}
  </div>
);

export default function Paso5Documentacion({
  docExpandido,
  toggleDoc,
  socios = [],
  onVolverASocios,
  avanzarPaso6,
  onGuardarSocioDb,
  isSubmitting,
  socioId,
}) {
  const { cadenaSlug } = useParams();
  const cadenaId = Number(cadenaSlug) || 1;
  const { requisitos } = useRequisitos(cadenaId);

  const docItemsFiltered = DOC_ITEMS.filter(({ key }) => {
    const configVal = requisitos?.documentos?.[key];
    return configVal !== 0; // 0 = no mostrar
  });
  const { register, control, setValue, trigger, clearErrors, getValues } =
    useFormContext();
  const { errors } = useFormState({ control });
  const {
    fields: representantes,
    append: appendRep,
    update: updateRep,
    remove: removeRep,
  } = useFieldArray({ control, name: "representantes" });

  const { data: provinciasData } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  const [archivosBackend, setArchivosBackend] = useState([]);

  const [uiState, setUiState] = useState({
    archivos: {},
    socioActivoIndex: null,
    repActivoIndex: null,
    modalDocsOpen: false,
    modalRepOpen: false,
    draggingKey: null,
    backupSocio: {},
    backupArchivos: {},
    intentoAvanzar: false,
    intentoGuardarSocio: false,
    isGuardando: false,
  });

  useEffect(() => {
    if (!socioId) return;
    const cargarArchivosBackend = async () => {
      try {
        const archivosExistentes =
          await socioArchivoService.obtenerArchivos(socioId);
        const arr = Array.isArray(archivosExistentes) ? archivosExistentes : [];
        setArchivosBackend(arr);

        if (arr.length > 0) {
          const tipoToKey = {};
          Object.entries(socioArchivoService.TIPO_DOCUMENTO_MAP).forEach(
            ([key, id]) => {
              tipoToKey[id] = key;
            },
          );

          const archivosRecuperados = {};
          arr.forEach((arch) => {
            const docKey = tipoToKey[arch.tipodocumentoarchivoid];
            if (
              docKey &&
              ["estatuto", "balance", "acta", "poderes", "cartasDocumento", "certificadoPyme", "otrosDocumentos"].includes(docKey)
            ) {
              // Crear un pseudo-File para mostrar en la UI
              const pseudoFile = new File(
                [""],
                arch.nombrearchivo || "archivo",
                {
                  type: "application/octet-stream",
                },
              );
              pseudoFile.formattedSize = arch.contenido ? formatBase64Size(arch.contenido) : "Disponible";
              pseudoFile._uploaded = true;
              pseudoFile._backendId = arch.socioarchivoid;
              archivosRecuperados[docKey] = pseudoFile;
            }
          });

          if (Object.keys(archivosRecuperados).length > 0) {
            setUiState((prev) => ({
              ...prev,
              archivos: { ...archivosRecuperados, ...prev.archivos },
            }));
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar archivos existentes:", err);
      }
    };
    cargarArchivosBackend();
  }, [socioId]);

  const {
    archivos,
    socioActivoIndex,
    repActivoIndex,
    modalDocsOpen,
    modalRepOpen,
    draggingKey,
    backupSocio,
    intentoAvanzar,
    intentoGuardarSocio,
    isGuardando,
  } = uiState;

  const updateState = (updates) => {
    setUiState((prev) => ({
      ...prev,
      ...(typeof updates === "function" ? updates(prev) : updates),
    }));
  };

  const emailFacturacionVal =
    useWatch({ control, name: "emailFacturacion" }) || "";

  React.useEffect(() => {
    if (!socios.length) return;

    const provincias = opcionesProvincias || [];

    socios.forEach((socio, index) => {
      const original = socio?.dataOriginal || {};
      const dg = original.datosgenerales;
      const dom = dg ? dg.domiciliofiscal || {} : {};
      const current = getValues(`socios.${index}`) || {};

      const updates = {};

      if (!current.email) {
        const email =
          (dg && (dg.email || dg.emailfacturacion)) ||
          original.mail ||
          original.Mail ||
          "";
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          updates.email = email;
        }
      }

      if (!current.celular) {
        const tel = original.telefono || original.Telefono || "";
        if (tel) updates.celular = tel;
      }

      if (!current.direccion) {
        const dir =
          dom.direccion ||
          (dg && dg.calle ? `${dg.calle} ${dg.numero || ""}`.trim() : "") ||
          original.calle ||
          original.Calle ||
          original.direccion ||
          original.Direccion ||
          "";
        if (dir) updates.direccion = dir;
      }

      if (!current.localidad) {
        const loc =
          dom.localidad || original.localidad || original.Localidad || "";
        if (loc) updates.localidad = loc;
      }

      if (!current.provincia) {
        const provNombre =
          dom.descripcionprovincia ||
          original.provincia ||
          original.Provincia ||
          "";
        if (provNombre) {
          const match = matchProvinciaAfip(provNombre, provincias);
          if (match) {
            updates.provincia = match.value;
          }
        } else if (original.provinciaid || original.ProvinciaId) {
          updates.provincia = original.provinciaid || original.ProvinciaId;
        }
      }

      if (Object.keys(updates).length > 0) {
        Object.keys(updates).forEach((key) => {
          setValue(`socios.${index}.${key}`, updates[key]);
        });
      }
    });
  }, [socios, getValues, setValue, opcionesProvincias]);

  // ── handlers  ──────────────────────────────────────────────────
  const handleFileUpload = (key, file) => {
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      updateState((prev) => ({
        archivos: {
          ...prev.archivos,
          [key]: Object.assign(file, { formattedSize: sizeMB }),
        },
      }));
    }
  };

  const handleFileRemove = (key) => {
    updateState((prev) => {
      const nuevos = { ...prev.archivos };
      delete nuevos[key];
      return { archivos: nuevos };
    });
  };

  const docsEmpresaListos = docItemsFiltered.every(({ key }) => {
    const configVal = requisitos?.documentos?.[key];
    if (configVal === 1) {
      return !!archivos[key];
    }
    return true; // Si es opcional (2) o no visible, no bloquea el avance
  });

  const handleAbrirModalRep = (index) =>
    updateState({ repActivoIndex: index, modalRepOpen: true });
  const handleGuardarRep = (repData) =>
    repActivoIndex !== null
      ? updateRep(repActivoIndex, repData)
      : appendRep(repData);

  const handleAvanzarClick = async () => {
    updateState({ intentoAvanzar: true });
    const isRepRequired = requisitos?.relaciones?.representantes === 1;
    const tieneRepresentantes = representantes.length > 0;
    const canAdvanceReps = !isRepRequired || tieneRepresentantes || requisitos?.relaciones?.representantes === 0;

    const emailFacValido = await trigger("emailFacturacion");
    if (
      docsEmpresaListos &&
      canAdvanceReps &&
      emailFacValido &&
      emailFacturacionVal.trim() !== ""
    ) {
      if (avanzarPaso6) avanzarPaso6();
    } else if (!canAdvanceReps && isRepRequired) {
      toast.error("Debe declarar al menos un representante o apoderado.");
    }
  };

  const errorEmailFacturacion =
    errors.emailFacturacion?.message ||
    (intentoAvanzar && emailFacturacionVal.trim() === ""
      ? "Obligatorio"
      : null);
  const isEmailFacturacionValido =
    !errorEmailFacturacion && emailFacturacionVal.trim() !== "";

  // ── pill helpers ────────────────────────────────────────────────────────────
  const pill = (done, warn) => {
    if (done) return styles.pillDone;
    if (warn) return styles.pillError;
    return styles.pillPending;
  };

  return (
    <div className={styles.container}>
      {/* HEADER ─────────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.completionPills}>
          <span
            className={`${styles.pill} ${pill(docsEmpresaListos, intentoAvanzar)}`}
          >
            {docsEmpresaListos ? (
              <FiCheckCircle size={11} />
            ) : (
              <FiAlertCircle size={11} />
            )}
            Documentos
          </span>
          {requisitos?.relaciones?.representantes !== 0 && (
            <span
              className={`${styles.pill} ${pill(representantes.length > 0, intentoAvanzar)}`}
            >
              {representantes.length > 0 ? (
                <FiCheckCircle size={11} />
              ) : (
                <FiAlertCircle size={11} />
              )}
              Representantes
            </span>
          )}
          <span
            className={`${styles.pill} ${pill(isEmailFacturacionValido, intentoAvanzar && !isEmailFacturacionValido)}`}
          >
            {isEmailFacturacionValido ? (
              <FiCheckCircle size={11} />
            ) : (
              <FiAlertCircle size={11} />
            )}
            Facturación
          </span>
        </div>
      </div>

      {/* GRID ────────────────────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        {/* DOCUMENTACIÓN */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Documentación Legal</span>
            <button
              type="button"
              className={`${styles.actionLink} ${docsEmpresaListos ? styles.actionLinkEdit : intentoAvanzar ? styles.actionLinkError : ""}`}
              onClick={() => updateState({ modalDocsOpen: true })}
            >
              {docsEmpresaListos ? (
                <>
                  <FiEdit2 size={11} /> Modificar
                </>
              ) : (
                <>Cargar documentos →</>
              )}
            </button>
          </div>
          <div
            className={styles.docGrid}
            onClick={() => updateState({ modalDocsOpen: true })}
          >
            {docItemsFiltered.map(({ key, label }) => {
              const isRequired = requisitos?.documentos?.[key] === 1;
              return (
                <div
                  key={key}
                  className={`${styles.docChip} ${
                    archivos[key]
                      ? styles.docChipDone
                      : (isRequired && intentoAvanzar)
                        ? styles.docChipError
                        : styles.docChipPending
                  }`}
                >
                  {archivos[key] ? (
                    <FiCheckCircle size={12} />
                  ) : (
                    <FiAlertCircle size={12} />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </section>



        {/* REPRESENTANTES */}
        {requisitos?.relaciones?.representantes !== 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionLabel}>
                Representantes y Apoderados
              </span>
              {representantes.length > 0 && (
                <button
                  type="button"
                  className={styles.actionLink}
                  onClick={() => handleAbrirModalRep(null)}
                >
                  <FiPlus size={11} /> Agregar
                </button>
              )}
            </div>

            {representantes.length === 0 ? (
              <button
                type="button"
                className={`${styles.emptySlot} ${intentoAvanzar ? styles.emptySlotError : ""}`}
                onClick={() => handleAbrirModalRep(null)}
              >
                <FiPlus size={14} />
                <span>Agregar representante o apoderado</span>
              </button>
            ) : (
              <div className={styles.compactList}>
                {representantes.map((rep, index) => (
                  <div
                    key={rep?.id || index}
                    className={`${styles.compactRow} ${styles.compactRowSuccess}`}
                  >
                    <span className={`${styles.statusDot} ${styles.dotGreen}`} />
                    <div className={styles.rowInfo}>
                      <strong className={styles.rowName}>{rep.nombre}</strong>
                      <span className={styles.rowSub}>
                        {rep.rol} · {rep.cuit}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleAbrirModalRep(index)}
                        title="Editar"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => removeRep(index)}
                        title="Eliminar"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* EMAIL FACTURACIÓN */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Email de Facturación</span>
            {isEmailFacturacionValido && (
              <span className={styles.validBadge}>
                <FiCheckCircle size={11} /> Configurado
              </span>
            )}
          </div>
          <InputSocioMasked
            control={control}
            name="emailFacturacion"
            label="Dirección de correo electrónico"
            icon={<FiMail />}
            type="email"
            error={errorEmailFacturacion}
            esValido={isEmailFacturacionValido}
            tooltip="Email a donde se enviarán todos los comprobantes, facturas contables y liquidaciones de la empresa."
          />
        </section>
      </div>

      {/* FOOTER ──────────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <Button
          variant="primary"
          size="md"
          onClick={handleAvanzarClick}
          className={styles.continueBtn}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "ENVIANDO..." : "CONTINUAR"}
        </Button>
      </div>

      {/* MODALS ──────────────────────────────────────────────────────────────── */}
      <DocumentosEmpresaModal
        isOpen={modalDocsOpen}
        onClose={() => updateState({ modalDocsOpen: false })}
        archivos={archivos}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        intentoAvanzar={intentoAvanzar}
        socioId={socioId}
        archivosBackend={archivosBackend}
        onArchivosBackendChange={setArchivosBackend}
        requisitos={requisitos}
      />

      <RepresentanteModal
        isOpen={modalRepOpen}
        onClose={() =>
          updateState({ modalRepOpen: false, repActivoIndex: null })
        }
        representanteInicial={
          repActivoIndex !== null ? representantes[repActivoIndex] : null
        }
        socioIdActivo={socioId}
        onGuardar={handleGuardarRep}
      />
      <PersistenciaOculta
        register={register}
        socios={socios}
        representantes={representantes}
      />
    </div>
  );
}

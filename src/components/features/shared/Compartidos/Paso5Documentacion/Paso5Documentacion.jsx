import React, { useState, useEffect, useCallback } from "react";
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
import { Button, InputFlotante, InputSocioMasked } from "../../../../ui";
import {
  SocioTaskCard,
  ModalDocumentosEmpresa,
  ModalRepresentante,
  ModalSocio,
} from "../../../../features";
import { useProvincias } from "../../../../../hooks/useCatalogos";
import { socioArchivoService } from "../../../../../services/socioArchivoService";
import styles from "./Paso5Documentacion.module.css";

const DOC_ITEMS = [
  { key: "estatuto", label: "Estatuto" },
  { key: "balance", label: "Balance" },
  { key: "acta", label: "Acta" },
  { key: "poderes", label: "Poderes" },
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
              ["estatuto", "balance", "acta", "poderes"].includes(docKey)
            ) {
              // Crear un pseudo-File para mostrar en la UI
              const pseudoFile = new File(
                [""],
                arch.nombrearchivo || "archivo",
                {
                  type: "application/octet-stream",
                },
              );
              pseudoFile.formattedSize = "Cargado";
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
        const provNombre = (
          dom.descripcionprovincia ||
          original.provincia ||
          original.Provincia ||
          ""
        ).toUpperCase();
        if (provNombre) {
          const match = provincias.find(
            (p) =>
              p.label.toUpperCase() === provNombre ||
              provNombre.includes(p.label.toUpperCase()) ||
              p.label.toUpperCase().includes(provNombre),
          );
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

  const docsEmpresaListos = DOC_ITEMS.every(({ key }) => archivos[key]);

  const isSocioCompleto = (index) => {
    const sEmail = getValues(`socios.${index}.email`);
    const sCel = getValues(`socios.${index}.celular`);
    const sDir = getValues(`socios.${index}.direccion`);
    const sProv = getValues(`socios.${index}.provincia`);
    const sLoc = getValues(`socios.${index}.localidad`);
    const errs = errors?.socios?.[index];
    const sinErrores = !errs || Object.keys(errs).length === 0;

    const tieneDniFrente = !!archivos[`socio-${index}-frente`];
    const tieneDniDorso = !!archivos[`socio-${index}-dorso`];

    return !!(
      sEmail &&
      sCel &&
      sDir &&
      sProv &&
      sLoc &&
      sinErrores &&
      tieneDniFrente &&
      tieneDniDorso
    );
  };

  const todosSociosOk =
    socios.length > 0 && socios.every((_, i) => isSocioCompleto(i));

  const handleAbrirModalSocio = (index) => {
    const socioTarget = socios[index];
    const dg = socioTarget?.dataOriginal?.datosgenerales || {};
    const dom = dg.domiciliofiscal || {};
    const currentFormValues = getValues(`socios.${index}`) || {};

    const emailHydrated =
      currentFormValues.email || dg.email || dg.emailfacturacion || "";
    const celularHydrated =
      currentFormValues.celular ||
      dg.celular ||
      dg.telefono ||
      dg.telefono2 ||
      "";
    const direccionHydrated =
      currentFormValues.direccion ||
      dom.direccion ||
      (dg.calle ? `${dg.calle} ${dg.numero || ""}`.trim() : "");
    const localidadHydrated =
      currentFormValues.localidad || dom.localidad || "";
    const provinciaHydrated =
      currentFormValues.provincia || dom.descripcionprovincia || "";

    setValue(`socios.${index}.email`, emailHydrated);
    setValue(`socios.${index}.celular`, celularHydrated);
    setValue(`socios.${index}.direccion`, direccionHydrated);
    setValue(`socios.${index}.localidad`, localidadHydrated);
    setValue(`socios.${index}.provincia`, provinciaHydrated);

    updateState({
      intentoGuardarSocio: false,
      backupSocio: {
        email: emailHydrated,
        celular: celularHydrated,
        direccion: direccionHydrated,
        localidad: localidadHydrated,
        provincia: provinciaHydrated,
      },
      backupArchivos: {
        frente: archivos[`socio-${index}-frente`],
        dorso: archivos[`socio-${index}-dorso`],
      },
      socioActivoIndex: index,
    });
  };

  const handleCerrarModalSinGuardar = () => {
    ["email", "celular", "direccion", "provincia", "localidad"].forEach(
      (campo) => {
        setValue(
          `socios.${socioActivoIndex}.${campo}`,
          backupSocio[campo] || "",
          {
            shouldValidate: false,
            shouldDirty: false,
          },
        );
      },
    );
    updateState((prev) => {
      const nuevos = { ...prev.archivos };
      if (prev.backupArchivos.frente)
        nuevos[`socio-${prev.socioActivoIndex}-frente`] =
          prev.backupArchivos.frente;
      else delete nuevos[`socio-${prev.socioActivoIndex}-frente`];
      if (prev.backupArchivos.dorso)
        nuevos[`socio-${prev.socioActivoIndex}-dorso`] =
          prev.backupArchivos.dorso;
      else delete nuevos[`socio-${prev.socioActivoIndex}-dorso`];
      return {
        archivos: nuevos,
        intentoGuardarSocio: false,
        socioActivoIndex: null,
      };
    });
    clearErrors(`socios.${socioActivoIndex}`);
  };

  const handleGuardarSocioModal = async () => {
    updateState({ intentoGuardarSocio: true, isGuardando: true });
    const camposValidos = await trigger([
      `socios.${socioActivoIndex}.email`,
      `socios.${socioActivoIndex}.celular`,
      `socios.${socioActivoIndex}.direccion`,
      `socios.${socioActivoIndex}.provincia`,
      `socios.${socioActivoIndex}.localidad`,
    ]);
    if (camposValidos) {
      try {
        const datosForm = getValues(`socios.${socioActivoIndex}`);
        if (onGuardarSocioDb)
          await onGuardarSocioDb(socioActivoIndex, datosForm);

        if (socioId) {
          const frenteKey = `socio-${socioActivoIndex}-frente`;
          const dorsoKey = `socio-${socioActivoIndex}-dorso`;
          const frenteFile = archivos[frenteKey];
          const dorsoFile = archivos[dorsoKey];

          const uploadPromises = [];
          if (
            frenteFile &&
            frenteFile instanceof File &&
            !frenteFile._uploaded
          ) {
            uploadPromises.push(
              socioArchivoService
                .subirOActualizar(
                  socioId,
                  frenteFile,
                  frenteKey,
                  archivosBackend,
                  `DNI Frente - ${datosForm.nombre || "Socio"}`,
                )
                .then((res) => {
                  frenteFile._uploaded = true;
                  return res;
                })
                .catch((err) =>
                  console.error(`❌ Error subiendo DNI frente:`, err),
                ),
            );
          }
          if (dorsoFile && dorsoFile instanceof File && !dorsoFile._uploaded) {
            uploadPromises.push(
              socioArchivoService
                .subirOActualizar(
                  socioId,
                  dorsoFile,
                  dorsoKey,
                  archivosBackend,
                  `DNI Dorso - ${datosForm.nombre || "Socio"}`,
                )
                .then((res) => {
                  dorsoFile._uploaded = true;
                  return res;
                })
                .catch((err) =>
                  console.error(`❌ Error subiendo DNI dorso:`, err),
                ),
            );
          }
          if (uploadPromises.length > 0) {
            await Promise.allSettled(uploadPromises);
          }
        }

        updateState({
          intentoGuardarSocio: false,
          socioActivoIndex: null,
          isGuardando: false,
        });
      } catch (error) {
        console.error("Fallo al guardar socio en DB:", error);
        updateState({ intentoGuardarSocio: false, isGuardando: false });
      }
    } else {
      updateState({ intentoGuardarSocio: false, isGuardando: false });
    }
  };

  const handleAbrirModalRep = (index) =>
    updateState({ repActivoIndex: index, modalRepOpen: true });
  const handleGuardarRep = (repData) =>
    repActivoIndex !== null
      ? updateRep(repActivoIndex, repData)
      : appendRep(repData);

  const handleAvanzarClick = async () => {
    updateState({ intentoAvanzar: true });
    const todosSociosOkLocal = socios.every((_, i) => isSocioCompleto(i));
    const tieneRepresentantes = representantes.length > 0;
    const emailFacValido = await trigger("emailFacturacion");
    if (
      docsEmpresaListos &&
      todosSociosOkLocal &&
      tieneRepresentantes &&
      emailFacValido &&
      emailFacturacionVal.trim() !== ""
    ) {
      if (avanzarPaso6) avanzarPaso6();
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
          <span
            className={`${styles.pill} ${pill(todosSociosOk, intentoAvanzar)}`}
          >
            {todosSociosOk ? (
              <FiCheckCircle size={11} />
            ) : (
              <FiAlertCircle size={11} />
            )}
            Socios
          </span>
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
            {DOC_ITEMS.map(({ key, label }) => (
              <div
                key={key}
                className={`${styles.docChip} ${
                  archivos[key]
                    ? styles.docChipDone
                    : intentoAvanzar
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
            ))}
          </div>
        </section>

        {/* SOCIOS */}
        <section className={`${styles.section} ${styles.borderLeft}`}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Socios</span>
            {socios.length > 0 && (
              <span className={styles.countBadge}>
                {socios.filter((_, i) => isSocioCompleto(i)).length}/
                {socios.length} completos
              </span>
            )}
          </div>
          <div className={styles.compactList}>
            {socios.map((socio, index) => (
              <SocioTaskCard
                key={socio?.cuit || index}
                socio={socio}
                index={index}
                isCompleto={isSocioCompleto(index)}
                intentoAvanzar={intentoAvanzar}
                onEdit={() => handleAbrirModalSocio(index)}
              />
            ))}
          </div>
        </section>

        {/* REPRESENTANTES */}
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

        {/* EMAIL FACTURACIÓN */}
        <section className={`${styles.section} ${styles.borderLeft}`}>
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
          />
        </section>
      </div>

      {/* FOOTER ──────────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <Button
          variant="primary"
          iconRight={!isSubmitting && <FiChevronRight />}
          onClick={handleAvanzarClick}
          className={styles.continueBtn}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "ENVIANDO..." : "CONTINUAR"}
        </Button>
      </div>

      {/* MODALS ──────────────────────────────────────────────────────────────── */}
      <ModalDocumentosEmpresa
        isOpen={modalDocsOpen}
        onClose={() => updateState({ modalDocsOpen: false })}
        archivos={archivos}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        intentoAvanzar={intentoAvanzar}
        socioId={socioId}
        archivosBackend={archivosBackend}
        onArchivosBackendChange={setArchivosBackend}
      />
      <ModalSocio
        socio={socioActivoIndex !== null ? socios[socioActivoIndex] : null}
        socioIndex={socioActivoIndex}
        archivos={archivos}
        intentoGuardarSocio={intentoGuardarSocio}
        onGuardar={handleGuardarSocioModal}
        isGuardando={isGuardando}
        onCerrar={handleCerrarModalSinGuardar}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        draggingKey={draggingKey}
        onDragOver={(key) => updateState({ draggingKey: key })}
        onDragLeave={() => updateState({ draggingKey: null })}
        onDrop={(key, file) => handleFileUpload(key, file)}
        control={control}
      />
      <ModalRepresentante
        isOpen={modalRepOpen}
        onClose={() =>
          updateState({ modalRepOpen: false, repActivoIndex: null })
        }
        representanteInicial={
          repActivoIndex !== null ? representantes[repActivoIndex] : null
        }
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

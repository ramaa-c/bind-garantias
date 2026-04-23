import React, { useState } from "react";
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
} from "react-icons/fi";
import { Button, InputFlotante } from "../../../../ui";
import {
  SocioTaskCard,
  ModalDocumentosEmpresa,
  ModalRepresentante,
  ModalSocio,
} from "../../../../features";
import styles from "./Paso5Documentacion.module.css";

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
  socios = [],
  avanzarPaso6,
  onGuardarSocioDb,
}) {
  const { register, control, setValue, trigger, clearErrors, getValues } =
    useFormContext();
  const { errors } = useFormState({ control });
  const {
    fields: representantes,
    append: appendRep,
    update: updateRep,
    remove: removeRep,
  } = useFieldArray({
    control,
    name: "representantes",
  });

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

  // --- HANDLERS ---
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

  const docsEmpresaListos = ["estatuto", "balance", "acta", "poderes"].every(
    (k) => archivos[k],
  );
  const cantDocsCargados = ["estatuto", "balance", "acta", "poderes"].filter(
    (k) => archivos[k],
  ).length;

  const isSocioCompleto = (index) => {
    const sEmail = getValues(`socios.${index}.email`);
    const sCel = getValues(`socios.${index}.celular`);
    const sDir = getValues(`socios.${index}.direccion`);
    const sProv = getValues(`socios.${index}.provincia`);
    const sLoc = getValues(`socios.${index}.localidad`);
    const errs = errors?.socios?.[index];
    const sinErrores = !errs || Object.keys(errs).length === 0;

    return !!(sEmail && sCel && sDir && sProv && sLoc && sinErrores);
  };

  const handleAbrirModalSocio = (index) => {
    const socioTarget = socios[index];
    const db = socioTarget?.dataOriginal || {};

    const currentFormValues = getValues(`socios.${index}`) || {};

    const emailHydrated = currentFormValues.email || db.email || "";
    const celularHydrated = currentFormValues.celular || db.telefono || "";
    const direccionHydrated = currentFormValues.direccion || db.calle || "";

    setValue(`socios.${index}.email`, emailHydrated, { shouldValidate: true });
    setValue(`socios.${index}.celular`, celularHydrated, {
      shouldValidate: true,
    });
    setValue(`socios.${index}.direccion`, direccionHydrated, {
      shouldValidate: true,
    });

    updateState({
      intentoGuardarSocio: false,
      backupSocio: {
        email: emailHydrated,
        celular: celularHydrated,
        direccion: direccionHydrated,
        provincia: currentFormValues.provincia || "",
        localidad: currentFormValues.localidad || "",
      },
      backupArchivos: {
        frente: archivos[`socio-${index}-frente`],
        dorso: archivos[`socio-${index}-dorso`],
      },
      socioActivoIndex: index,
    });
  };

  const handleCerrarModalSinGuardar = () => {
    const campos = ["email", "celular", "direccion", "provincia", "localidad"];
    campos.forEach((campo) => {
      setValue(
        `socios.${socioActivoIndex}.${campo}`,
        backupSocio[campo] || "",
        { shouldValidate: false, shouldDirty: false },
      );
    });
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
        if (onGuardarSocioDb) {
          await onGuardarSocioDb(socioActivoIndex, datosForm);
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
    const todosSociosOk = socios.every((_, i) => isSocioCompleto(i));
    const tieneRepresentantes = representantes.length > 0;
    const emailFacValido = await trigger("emailFacturacion");

    if (
      docsEmpresaListos &&
      todosSociosOk &&
      tieneRepresentantes &&
      emailFacValido &&
      emailFacturacionVal.trim() !== ""
    ) {
      if (avanzarPaso6) avanzarPaso6();
    }
  };

  const getClassEmpresa = () => {
    if (docsEmpresaListos) return styles.statusCheck;
    if (intentoAvanzar) return styles.statusError;
    return styles.statusWarn;
  };

  const errorEmailFacturacion =
    errors.emailFacturacion?.message ||
    (intentoAvanzar && emailFacturacionVal.trim() === ""
      ? "Obligatorio"
      : null);
  const isEmailFacturacionValido =
    !errorEmailFacturacion && emailFacturacionVal.trim() !== "";

  return (
    <div className={styles.container}>
      <div className={styles.headerSteps}>
        <h3 className={styles.title}>Configuración de la Solicitud</h3>
        <p className={styles.mutedText}>
          Completá la información requerida para estructurar la línea.
        </p>
      </div>

      {/* 1. DOCUMENTACIÓN EMPRESA */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeaderRow}>
          <h4 className={styles.sectionTitle}>1. Documentación Legal</h4>
        </div>
        <div
          className={`${styles.taskCard} ${docsEmpresaListos ? styles.cardSuccess : intentoAvanzar ? styles.cardError : ""}`}
          onClick={() => updateState({ modalDocsOpen: true })}
        >
          <div className={styles.taskCardInfo}>
            <div className={`${styles.statusIconPill} ${getClassEmpresa()}`}>
              {docsEmpresaListos ? <FiCheckCircle /> : <FiAlertCircle />}
            </div>
            <div className={styles.taskCardText}>
              <h4>Documentos de la Sociedad</h4>
              <p>{cantDocsCargados} de 4 cargados</p>
            </div>
          </div>
          {docsEmpresaListos ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={styles.taskBtn}
              onClick={(e) => {
                e.stopPropagation();
                updateState({ modalDocsOpen: true });
              }}
            >
              <FiEdit2 size={12} /> MODIFICAR
            </Button>
          ) : (
            <Button variant="outline" size="sm" className={styles.taskBtn}>
              CARGAR DATOS
            </Button>
          )}
        </div>
      </div>

      {/* 2. SOCIOS */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeaderRow}>
          <h4 className={styles.sectionTitle}>2. Información de Socios</h4>
        </div>
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

      {/* 3. REPRESENTANTES LEGALES */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeaderRow}>
          <h4 className={styles.sectionTitle}>
            3. Representantes y Apoderados
          </h4>
          {representantes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className={styles.addBtnSmall}
              onClick={() => handleAbrirModalRep(null)}
            >
              <FiPlus /> AGREGAR
            </Button>
          )}
        </div>

        {representantes.length === 0 ? (
          <div
            className={`${styles.taskCard} ${intentoAvanzar ? styles.cardError : ""}`}
            onClick={() => handleAbrirModalRep(null)}
          >
            <div className={styles.taskCardInfo}>
              <div
                className={`${styles.statusIconPill} ${intentoAvanzar ? styles.statusError : styles.statusWarn}`}
              >
                <FiAlertCircle />
              </div>
              <div className={styles.taskCardText}>
                <h4>Falta designar representantes</h4>
                <p>Agregá al menos un representante o apoderado para firmar.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className={styles.taskBtn}>
              AGREGAR
            </Button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {representantes.map((rep, index) => (
              <div
                key={rep?.id || index}
                className={`${styles.taskCard} ${styles.cardSuccess}`}
              >
                <div className={styles.taskCardInfo}>
                  <div
                    className={`${styles.statusIconPill} ${styles.statusCheck}`}
                  >
                    <FiCheckCircle />
                  </div>
                  <div className={styles.taskCardText}>
                    <h4>{rep.nombre}</h4>
                    <p>
                      {rep.rol} · CUIT {rep.cuit}
                    </p>
                  </div>
                </div>
                <div className={styles.actionButtonsGroup}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.btnEditAction}
                    onClick={() => handleAbrirModalRep(index)}
                  >
                    <FiEdit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.btnDeleteAction}
                    onClick={() => removeRep(index)}
                  >
                    <FiTrash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. FACTURACIÓN */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeaderRow}>
          <h4 className={styles.sectionTitle}>4. Contacto de Facturación</h4>
        </div>

        <div
          className={`${styles.inputCard} ${errorEmailFacturacion ? styles.cardError : isEmailFacturacionValido ? styles.cardSuccess : ""}`}
        >
          <div className={styles.taskCardInfo} style={{ width: "100%" }}>
            <div
              className={`${styles.statusIconPill} ${isEmailFacturacionValido ? styles.statusCheck : errorEmailFacturacion ? styles.statusError : styles.statusWarn}`}
            >
              {isEmailFacturacionValido ? <FiCheckCircle /> : <FiAlertCircle />}
            </div>
            <div style={{ flex: 1 }}>
              <div
                className={styles.taskCardText}
                style={{ marginBottom: "2rem" }}
              >
                <h4>Recepción de Comprobantes</h4>
                <p>
                  Indicá el correo electrónico donde recibirás la facturación.
                </p>
              </div>
              <InputFlotante
                compact
                name="emailFacturacion"
                label="Email de facturación"
                autoComplete="none"
                type="email"
                error={errorEmailFacturacion}
                esValido={isEmailFacturacionValido}
                value={emailFacturacionVal}
                onChange={(e) =>
                  setValue("emailFacturacion", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionsRight}>
        <Button
          variant="primary"
          iconRight={<FiChevronRight />}
          onClick={handleAvanzarClick}
          className={styles.tallButton}
        >
          CONTINUAR
        </Button>
      </div>

      {/* --- MODALES --- */}
      <ModalDocumentosEmpresa
        isOpen={modalDocsOpen}
        onClose={() => updateState({ modalDocsOpen: false })}
        archivos={archivos}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        intentoAvanzar={intentoAvanzar}
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

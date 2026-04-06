import React, { useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiChevronRight,
} from "react-icons/fi";
import { Button } from "../../../ui";
import {
  SocioTaskCard,
  ModalDocumentosEmpresa,
  ModalRepresentanteFacturacion,
  ModalSocio,
} from "../../../features";

import styles from "./Paso5Documentacion.module.css";

const PersistenciaOculta = ({ register, socios }) => (
  <div style={{ display: "none" }}>
    <input {...register("apoCuit")} />
    <input {...register("apoEmail")} />
    <input {...register("apoCelular")} />
    <input {...register("emailFacturacion")} />

    {socios.map((socio, i) => (
      <React.Fragment key={socio.cuit || i}>
        <input {...register(`socios.${i}.email`)} />
        <input {...register(`socios.${i}.celular`)} />
        <input {...register(`socios.${i}.direccion`)} />
        <input {...register(`socios.${i}.provincia`)} />
        <input {...register(`socios.${i}.localidad`)} />
      </React.Fragment>
    ))}
  </div>
);

export default function Paso5Documentacion({
  socios,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  apoRol,
  validarCuitApoderado,
  guardarApoderado,
  setApoRol,
  avanzarPaso6,
}) {
  const {
    register,
    control,
    setValue,
    trigger,
    clearErrors,
    getValues,
  } = useFormContext();

  const { errors } = useFormState({ control });

  // --- ESTADOS LOCALES ---
  const [uiState, setUiState] = useState({
    archivos: {},
    socioActivoIndex: null,
    modalDocsOpen: false,
    modalApoOpen: false,
    draggingKey: null,
    backupSocio: {},
    backupArchivos: {},
    intentoAvanzar: false,
    intentoGuardarSocio: false,
  });

  const {
    archivos,
    socioActivoIndex,
    modalDocsOpen,
    modalApoOpen,
    draggingKey,
    backupSocio,
    intentoAvanzar,
    intentoGuardarSocio,
  } = uiState;

  const updateState = (updates) => {
    setUiState((prev) => ({
      ...prev,
      ...(typeof updates === "function" ? updates(prev) : updates),
    }));
  };

  const emailFacturacionVal =
    useWatch({ control, name: "emailFacturacion" }) || "";

  // --- HANDLERS DE ARCHIVOS ---
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

  // --- VALIDACIONES ---
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

    const dniFrenteSubido = archivos[`socio-${index}-frente`];
    const dniDorsoSubido = archivos[`socio-${index}-dorso`];

    return !!(
      sEmail &&
      sCel &&
      sDir &&
      sProv &&
      sLoc &&
      sinErrores &&
      dniFrenteSubido &&
      dniDorsoSubido
    );
  };

  const seccionApoFacturacionLista =
    faseApoderado === "guardado" &&
    !errors.emailFacturacion &&
    emailFacturacionVal.trim() !== "";

  // --- HANDLERS ACCIONES ---
  const handleAbrirModalSocio = (index) => {
    const datosTextosActuales = getValues(`socios.${index}`) || {};
    updateState({
      intentoGuardarSocio: false,
      backupSocio: JSON.parse(JSON.stringify(datosTextosActuales)),
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
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );
    });
    updateState((prev) => {
      const nuevos = { ...prev.archivos };
      if (prev.backupArchivos.frente)
        nuevos[`socio-${prev.socioActivoIndex}-frente`] = prev.backupArchivos.frente;
      else delete nuevos[`socio-${prev.socioActivoIndex}-frente`];
      if (prev.backupArchivos.dorso)
        nuevos[`socio-${prev.socioActivoIndex}-dorso`] = prev.backupArchivos.dorso;
      else delete nuevos[`socio-${prev.socioActivoIndex}-dorso`];
      return { archivos: nuevos, intentoGuardarSocio: false, socioActivoIndex: null };
    });
    clearErrors(`socios.${socioActivoIndex}`);
  };

  const handleGuardarSocioModal = async () => {
    updateState({ intentoGuardarSocio: true });
    const camposValidos = await trigger([
      `socios.${socioActivoIndex}.email`,
      `socios.${socioActivoIndex}.celular`,
      `socios.${socioActivoIndex}.direccion`,
      `socios.${socioActivoIndex}.provincia`,
      `socios.${socioActivoIndex}.localidad`,
    ]);
    const dniFrente = archivos[`socio-${socioActivoIndex}-frente`];
    const dniDorso = archivos[`socio-${socioActivoIndex}-dorso`];
    if (camposValidos && dniFrente && dniDorso) {
      updateState({ intentoGuardarSocio: false, socioActivoIndex: null });
    }
  };

  const handleAvanzarClick = () => {
    updateState({ intentoAvanzar: true });
    const todosSociosOk = socios.every((_, i) => isSocioCompleto(i));

    if (docsEmpresaListos && todosSociosOk && seccionApoFacturacionLista) {
      avanzarPaso6();
    }
  };

  // --- HELPERS VISUALES ---
  const getClassEmpresa = () => {
    if (docsEmpresaListos) return styles.statusCheck;
    if (intentoAvanzar) return styles.statusError;
    return styles.statusWarn;
  };

  const getClassApoderado = () => {
    if (seccionApoFacturacionLista) return styles.statusCheck;
    if (intentoAvanzar) return styles.statusError;
    return styles.statusWarn;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSteps}>
        <h3 className={styles.title}>Configuración de la Solicitud</h3>
        <p className={styles.mutedText}>
          Completá los 3 bloques de información obligatoria.
        </p>
      </div>

      {/* 1. DOCUMENTACIÓN EMPRESA */}
      <div className={styles.sectionGroup}>
        <h4 className={styles.sectionTitle}>1. Documentación Legal</h4>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              updateState({ modalDocsOpen: true });
            }
          }}
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
        <h4 className={styles.sectionTitle}>2. Información de Socios</h4>
        {socios.map((socio, index) => (
          <SocioTaskCard
            key={socio.cuit}
            socio={socio}
            index={index}
            isCompleto={isSocioCompleto(index)}
            intentoAvanzar={intentoAvanzar}
            onEdit={() => handleAbrirModalSocio(index)}
          />
        ))}
      </div>

      {/* 3. APODERADO Y FACTURACIÓN */}
      <div className={styles.sectionGroup}>
        <h4 className={styles.sectionTitle}>3. Gestión y Contacto</h4>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              updateState({ modalApoOpen: true });
            }
          }}
          className={`${styles.taskCard} ${seccionApoFacturacionLista ? styles.cardSuccess : intentoAvanzar ? styles.cardError : ""}`}
          onClick={() => updateState({ modalApoOpen: true })}
        >
          <div className={styles.taskCardInfo}>
            <div className={`${styles.statusIconPill} ${getClassApoderado()}`}>
              {seccionApoFacturacionLista ? (
                <FiCheckCircle />
              ) : (
                <FiAlertCircle />
              )}
            </div>
            <div className={styles.taskCardText}>
              <h4>Representante y Facturación</h4>
              <p>
                {faseApoderado === "guardado"
                  ? apoNombre
                  : "Identidad y mail de facturación"}
              </p>
            </div>
          </div>
          {seccionApoFacturacionLista ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFaseApoderado("completar");
                updateState({ modalApoOpen: true });
              }}
            >
              <FiEdit2 size={12} /> MODIFICAR
            </Button>
          ) : (
            <Button variant="outline" size="sm" className={styles.taskBtn}>
              CONFIGURAR
            </Button>
          )}
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

      <ModalRepresentanteFacturacion
        isOpen={modalApoOpen}
        onClose={() => updateState({ modalApoOpen: false })}
        faseApoderado={faseApoderado}
        setFaseApoderado={setFaseApoderado}
        apoNombre={apoNombre}
        apoRol={apoRol}
        setApoRol={setApoRol}
        onValidarCuit={validarCuitApoderado}
        onGuardarApoderado={guardarApoderado}
      />

      <ModalSocio
        socio={socioActivoIndex !== null ? socios[socioActivoIndex] : null}
        socioIndex={socioActivoIndex}
        archivos={archivos}
        intentoGuardarSocio={intentoGuardarSocio}
        onGuardar={handleGuardarSocioModal}
        onCerrar={handleCerrarModalSinGuardar}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        draggingKey={draggingKey}
        onDragOver={(key) => updateState({ draggingKey: key })}
        onDragLeave={() => updateState({ draggingKey: null })}
        onDrop={(key, file) => handleFileUpload(key, file)}
        control={control}
      />

      {/* PERSISTENCIA */}
      <PersistenciaOculta register={register} socios={socios} />
    </div>
  );
}

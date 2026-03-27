import React, { useState } from "react";
import { useFormContext, useFormState } from "react-hook-form";
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

export default function Paso5Documentacion({
  socios,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  apoRol,
  validarCuitApoderado,
  guardarApoderado,
  avanzarPaso6,
}) {
  const {
    register,
    watch,
    control,
    setValue,
    trigger,
    clearErrors,
    getValues,
  } = useFormContext();

  const { errors } = useFormState({ control });

  // --- ESTADOS LOCALES ---
  const [archivos, setArchivos] = useState({});
  const [socioActivoIndex, setSocioActivoIndex] = useState(null);
  const [modalDocsOpen, setModalDocsOpen] = useState(false);
  const [modalApoOpen, setModalApoOpen] = useState(false);
  const [draggingKey, setDraggingKey] = useState(null);

  const [backupSocio, setBackupSocio] = useState({});
  const [backupArchivos, setBackupArchivos] = useState({});

  const [intentoAvanzar, setIntentoAvanzar] = useState(false);
  const [intentoGuardarSocio, setIntentoGuardarSocio] = useState(false);

  const emailFacturacionVal = watch("emailFacturacion") || "";

  // --- HANDLERS DE ARCHIVOS ---
  const handleFileUpload = (key, file) => {
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      setArchivos((prev) => ({
        ...prev,
        [key]: Object.assign(file, { formattedSize: sizeMB }),
      }));
    }
  };

  const handleFileRemove = (key) => {
    setArchivos((prev) => {
      const nuevos = { ...prev };
      delete nuevos[key];
      return nuevos;
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
    setIntentoGuardarSocio(false);
    const datosTextosActuales = getValues(`socios.${index}`) || {};
    setBackupSocio(JSON.parse(JSON.stringify(datosTextosActuales)));
    setBackupArchivos({
      frente: archivos[`socio-${index}-frente`],
      dorso: archivos[`socio-${index}-dorso`],
    });
    setSocioActivoIndex(index);
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
    setArchivos((prev) => {
      const nuevos = { ...prev };
      if (backupArchivos.frente)
        nuevos[`socio-${socioActivoIndex}-frente`] = backupArchivos.frente;
      else delete nuevos[`socio-${socioActivoIndex}-frente`];
      if (backupArchivos.dorso)
        nuevos[`socio-${socioActivoIndex}-dorso`] = backupArchivos.dorso;
      else delete nuevos[`socio-${socioActivoIndex}-dorso`];
      return nuevos;
    });
    clearErrors(`socios.${socioActivoIndex}`);
    setIntentoGuardarSocio(false);
    setSocioActivoIndex(null);
  };

  const handleGuardarSocioModal = async () => {
    setIntentoGuardarSocio(true);
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
      setIntentoGuardarSocio(false);
      setSocioActivoIndex(null);
    }
  };

  const handleAvanzarClick = () => {
    setIntentoAvanzar(true);
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
          className={`${styles.taskCard} ${docsEmpresaListos ? styles.cardSuccess : intentoAvanzar ? styles.cardError : ""}`}
          onClick={() => setModalDocsOpen(true)}
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
            <button
              type="button"
              className={styles.btnEdit}
              onClick={(e) => {
                e.stopPropagation();
                setModalDocsOpen(true);
              }}
            >
              <FiEdit2 size={12} /> MODIFICAR
            </button>
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
            key={index}
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
          className={`${styles.taskCard} ${seccionApoFacturacionLista ? styles.cardSuccess : intentoAvanzar ? styles.cardError : ""}`}
          onClick={() => setModalApoOpen(true)}
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
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                setModalApoOpen(true);
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
        onClose={() => setModalDocsOpen(false)}
        archivos={archivos}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        intentoAvanzar={intentoAvanzar}
      />

      <ModalRepresentanteFacturacion
        isOpen={modalApoOpen}
        onClose={() => setModalApoOpen(false)}
        faseApoderado={faseApoderado}
        setFaseApoderado={setFaseApoderado}
        apoNombre={apoNombre}
        apoRol={apoRol}
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
        onDragOver={(key) => setDraggingKey(key)}
        onDragLeave={() => setDraggingKey(null)}
        onDrop={(key, file) => handleFileUpload(key, file)}
        control={control}
      />

      {/* PERSISTENCIA */}
      <div style={{ display: "none" }}>
        {socios.map((_, i) => (
          <React.Fragment key={i}>
            <input {...register(`socios.${i}.email`)} />
            <input {...register(`socios.${i}.celular`)} />
            <input {...register(`socios.${i}.direccion`)} />
            <input {...register(`socios.${i}.provincia`)} />
            <input {...register(`socios.${i}.localidad`)} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

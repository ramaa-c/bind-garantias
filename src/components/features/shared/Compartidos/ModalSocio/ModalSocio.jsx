import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext, Controller } from "react-hook-form";
import { FiUser, FiX, FiArrowRight } from "react-icons/fi";
import { InputFlotante, Button, CargaArchivos } from "../../../../ui";
import { useEscape } from "../../../../../hooks/useEscape";
import styles from "./ModalSocio.module.css";

/*  Sub-componente: Dropzone  */
const DropzoneField = ({
  fileKey,
  title,
  subtitle,
  intentoGuardarSocio,
  archivos,
  draggingKey,
  onFileUpload,
  onFileRemove,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const tieneError = intentoGuardarSocio && !archivos[fileKey];
  return (
    <div className={styles.dropzoneWrapper}>
      <input
        type="file"
        id={`file-input-${fileKey}`}
        style={{ display: "none" }}
        onChange={(e) => onFileUpload(fileKey, e.target.files[0])}
      />
      <CargaArchivos
        title={title}
        subtitle={subtitle}
        hasError={tieneError}
        file={
          archivos[fileKey]
            ? {
                name: archivos[fileKey].name,
                size: archivos[fileKey].formattedSize,
              }
            : null
        }
        onClick={() => document.getElementById(`file-input-${fileKey}`).click()}
        onRemove={() => onFileRemove(fileKey)}
        isDragging={draggingKey === fileKey}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(fileKey);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0])
            onDrop(fileKey, e.dataTransfer.files[0]);
        }}
      />
    </div>
  );
};

function useIsMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpointPx : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, [breakpointPx]);
  return isMobile;
}

/*  Componente Principal  */
export default function ModalSocio({
  socio,
  socioIndex,
  archivos,
  intentoGuardarSocio,
  onGuardar,
  onCerrar,
  onFileUpload,
  onFileRemove,
  draggingKey,
  onDragOver,
  onDragLeave,
  onDrop,
  control,
}) {
  const { trigger, clearErrors } = useFormContext();
  const isMounted = useRef(false);
  const isMobile = useIsMobile(900);

  const [step, setStep] = useState(1);
  const [haIntentadoAvanzar, setHaIntentadoAvanzar] = useState(false);
  const [haIntentadoFinalizar, setHaIntentadoFinalizar] = useState(false);

  const isModalOpen = socioIndex !== null;
  useEscape(onCerrar, isModalOpen);

  useEffect(() => {
    if (socioIndex === null) {
      isMounted.current = false;
      setStep(1);
      setHaIntentadoAvanzar(false);
      setHaIntentadoFinalizar(false);
    }
  }, [socioIndex]);

  if (!isModalOpen || !socio) return null;

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onCerrar();
  };

  const handleSiguiente = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setHaIntentadoAvanzar(true);
    const campos = [
      `socios.${socioIndex}.email`,
      `socios.${socioIndex}.celular`,
      `socios.${socioIndex}.direccion`,
      `socios.${socioIndex}.provincia`,
      `socios.${socioIndex}.localidad`,
    ];

    const ok = await trigger(campos);
    if (ok) {
      clearErrors([`socio-${socioIndex}-frente`, `socio-${socioIndex}-dorso`]);
      setStep(2);
      setHaIntentadoAvanzar(false);
      setHaIntentadoFinalizar(false);
    }
  };

  const handleSubmitInterno = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile && step === 1) {
      handleSiguiente(e);
      return;
    }
    setHaIntentadoFinalizar(true);
    onGuardar();
  };

  const enPaso1Movil = isMobile && step === 1;

  const evaluarError = (fieldState, value) => {
    const hasValue = value !== undefined && value.toString().trim().length > 0;
    const mostrarError =
      fieldState.error &&
      (fieldState.isDirty ||
        hasValue ||
        intentoGuardarSocio ||
        haIntentadoAvanzar);
    return mostrarError ? fieldState.error.message : null;
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.modalContainer}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.btnClose} onClick={onCerrar}>
          <FiX size={20} />
        </button>

        <form className={styles.body} onSubmit={handleSubmitInterno}>
          <div className={styles.iconWrapper}>
            <FiUser size={30} />
          </div>

          <h2 className={styles.title}>Datos de {socio.nombre}</h2>

          {isMobile && (
            <div className={styles.stepIndicator}>
              <span
                className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ""}`}
              />
              <span className={styles.stepLine} />
              <span
                className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ""}`}
              />
            </div>
          )}

          <p className={styles.description}>
            {isMobile
              ? step === 1
                ? "Paso 1 de 2 — Información de contacto"
                : "Paso 2 de 2 — Identidad (DNI)"
              : "Completá la información de contacto y cargá la documentación."}
          </p>

          <div className={styles.formSection}>
            {(!isMobile || step === 1) && (
              <>
                <h4 className={styles.sectionTitle}>
                  1. Información de contacto
                </h4>

                <div className={styles.inputRow}>
                  <Controller
                    name={`socios.${socioIndex}.email`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputFlotante
                        label="Email"
                        type="email"
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={evaluarError(fieldState, field.value)}
                        esValido={
                          !fieldState.error &&
                          field.value?.toString().trim().length > 0
                        }
                      />
                    )}
                  />

                  <Controller
                    name={`socios.${socioIndex}.celular`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputFlotante
                        label="Celular"
                        maxLength={10}
                        value={field.value || ""}
                        onChange={(e) => {
                          const limpio = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          field.onChange(limpio);
                        }}
                        error={evaluarError(fieldState, field.value)}
                        esValido={
                          !fieldState.error &&
                          field.value?.toString().trim().length > 0
                        }
                      />
                    )}
                  />
                </div>

                <Controller
                  name={`socios.${socioIndex}.direccion`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputFlotante
                      label="Dirección"
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={evaluarError(fieldState, field.value)}
                      esValido={
                        !fieldState.error &&
                        field.value?.toString().trim().length > 0
                      }
                    />
                  )}
                />

                <div className={styles.inputRow}>
                  <Controller
                    name={`socios.${socioIndex}.provincia`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputFlotante
                        label="Provincia"
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={evaluarError(fieldState, field.value)}
                        esValido={
                          !fieldState.error &&
                          field.value?.toString().trim().length > 0
                        }
                      />
                    )}
                  />

                  <Controller
                    name={`socios.${socioIndex}.localidad`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputFlotante
                        label="Localidad"
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={evaluarError(fieldState, field.value)}
                        esValido={
                          !fieldState.error &&
                          field.value?.toString().trim().length > 0
                        }
                      />
                    )}
                  />
                </div>
              </>
            )}

            {(!isMobile || step === 2) && (
              <>
                <h4 className={styles.sectionTitle}>
                  {isMobile ? "Identidad (DNI)" : "2. Identidad (DNI)"}
                </h4>
                <div className={styles.dropzoneGrid}>
                  <DropzoneField
                    fileKey={`socio-${socioIndex}-frente`}
                    title="DNI Frente"
                    subtitle="Imagen clara y legible"
                    intentoGuardarSocio={haIntentadoFinalizar}
                    archivos={archivos}
                    draggingKey={draggingKey}
                    onFileUpload={onFileUpload}
                    onFileRemove={onFileRemove}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  />
                  <DropzoneField
                    fileKey={`socio-${socioIndex}-dorso`}
                    title="DNI Dorso"
                    subtitle="Imagen clara y legible"
                    intentoGuardarSocio={haIntentadoFinalizar}
                    archivos={archivos}
                    draggingKey={draggingKey}
                    onFileUpload={onFileUpload}
                    onFileRemove={onFileRemove}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Footer de Acciones ── */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={isMobile && step === 2 ? () => setStep(1) : onCerrar}
            >
              {isMobile && step === 2 ? "VOLVER" : "CANCELAR"}
            </Button>

            {enPaso1Movil ? (
              <Button
                type="button"
                variant="primary"
                onClick={(e) => handleSiguiente(e)}
                iconRight={<FiArrowRight />}
              >
                SIGUIENTE
              </Button>
            ) : (
              <Button type="submit" variant="primary">
                GUARDAR DATOS
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

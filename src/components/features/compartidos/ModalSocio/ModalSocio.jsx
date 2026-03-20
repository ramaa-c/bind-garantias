import React, { useEffect, useRef } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { FiUser, FiX } from "react-icons/fi";
import { InputFlotante, Button, CargaArchivos } from "../../../ui";
import styles from "./ModalSocio.module.css";

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
  const { register, watch, trigger } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const valoresCampos = watch(`socios.${socioIndex}`) ?? {};
  const isMounted = useRef(false);


  useEffect(() => {
    if (socioIndex === null) return;
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    trigger([
      `socios.${socioIndex}.email`,
      `socios.${socioIndex}.celular`,
      `socios.${socioIndex}.direccion`,
      `socios.${socioIndex}.provincia`,
      `socios.${socioIndex}.localidad`,
    ]);
  }, [valoresCampos]);

  useEffect(() => {
    if (socioIndex === null) {
      isMounted.current = false;
    }
  }, [socioIndex]);

  const getCampo = (campo) => {
    if (socioIndex === null) return { error: null, esValido: false };
    const hasError = errors?.socios?.[socioIndex]?.[campo];
    const isDirty = dirtyFields?.socios?.[socioIndex]?.[campo];
    const val = valoresCampos[campo];
    const mostrarError = hasError && (isDirty || intentoGuardarSocio);
    return {
      error: mostrarError ? hasError.message : null,
      esValido:
        !hasError &&
        val &&
        val.toString().trim().length > 0 &&
        (isDirty || intentoGuardarSocio),
    };
  };

  const renderDropzone = (key, title, subtitle) => {
    const tieneError = intentoGuardarSocio && !archivos[key];
    return (
      <div className={styles.dropzoneWrapper}>
        <input
          type="file"
          id={`file-input-${key}`}
          style={{ display: "none" }}
          onChange={(e) => onFileUpload(key, e.target.files[0])}
        />
        <CargaArchivos
          title={title}
          subtitle={subtitle}
          hasError={tieneError}
          file={
            archivos[key]
              ? { name: archivos[key].name, size: archivos[key].formattedSize }
              : null
          }
          onClick={() => document.getElementById(`file-input-${key}`).click()}
          onRemove={() => onFileRemove(key)}
          isDragging={draggingKey === key}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(key);
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) onDrop(key, e.dataTransfer.files[0]);
          }}
        />
      </div>
    );
  };

  // --- TRUCO ANTI-CIERRE ACCIDENTAL ---
  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onCerrar();
    }
  };

  if (socioIndex === null || !socio) return null;

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.btnClose} onClick={onCerrar}>
          <FiX size={20} />
        </button>

        <div className={styles.body}>
          <div className={styles.iconWrapper}>
            <FiUser size={30} />
          </div>

          <h2 className={styles.title}>Datos de {socio.nombre}</h2>
          <p className={styles.description}>
            Completá la información de contacto y cargá la documentación.
          </p>

          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>1. Información de contacto</h4>

            <div className={styles.inputRow}>
              <InputFlotante
                label="Email"
                type="email"
                esValido={getCampo("email").esValido}
                error={getCampo("email").error}
                {...register(`socios.${socioIndex}.email`)}
              />
              <InputFlotante
                label="Celular"
                maxLength={10}
                esValido={getCampo("celular").esValido}
                error={getCampo("celular").error}
                {...register(`socios.${socioIndex}.celular`)}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  register(`socios.${socioIndex}.celular`).onChange(e);
                }}
              />
            </div>

            <InputFlotante
              label="Dirección"
              esValido={getCampo("direccion").esValido}
              error={getCampo("direccion").error}
              {...register(`socios.${socioIndex}.direccion`)}
            />

            <div className={styles.inputRow}>
              <InputFlotante
                label="Provincia"
                esValido={getCampo("provincia").esValido}
                error={getCampo("provincia").error}
                {...register(`socios.${socioIndex}.provincia`)}
              />
              <InputFlotante
                label="Localidad"
                esValido={getCampo("localidad").esValido}
                error={getCampo("localidad").error}
                {...register(`socios.${socioIndex}.localidad`)}
              />
            </div>

            <h4 className={styles.sectionTitle}>2. Identidad (DNI)</h4>

            <div className={styles.dropzoneGrid}>
              {renderDropzone(`socio-${socioIndex}-frente`, "DNI Frente", "Imagen clara y legible")}
              {renderDropzone(`socio-${socioIndex}-dorso`, "DNI Dorso", "Imagen clara y legible")}
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              className={styles.ghostBtn}
              onClick={onCerrar}
            >
              CANCELAR
            </Button>
            <Button type="button" variant="primary" onClick={onGuardar}>
              GUARDAR DATOS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
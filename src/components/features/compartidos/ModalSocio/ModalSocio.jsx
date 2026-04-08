import React, { useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FiUser, FiX } from "react-icons/fi";
import { InputFlotante, Button, CargaArchivos } from "../../../ui";
import { useEscape } from "../../../../hooks/useEscape";
import styles from "./ModalSocio.module.css";

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
            ? { name: archivos[fileKey].name, size: archivos[fileKey].formattedSize }
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
          if (e.dataTransfer.files?.[0]) onDrop(fileKey, e.dataTransfer.files[0]);
        }}
      />
    </div>
  );
};

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
  const { trigger, setValue } = useFormContext();
  const { errors, dirtyFields } = useFormState({ control });

  const rawWatch = useWatch({ control, name: `socios.${socioIndex}` });
  const valoresCampos = useMemo(() => rawWatch ?? {}, [rawWatch]);
  const isMounted = useRef(false);

  const isModalOpen = socioIndex !== null;
  useEscape(onCerrar, isModalOpen);

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
  }, [valoresCampos, socioIndex, trigger]);

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
    const hasValue = val !== undefined && val.toString().trim().length > 0;

    const mostrarError =
      hasError && (isDirty || hasValue || intentoGuardarSocio);

    return {
      error: mostrarError ? hasError.message : null,
      esValido: !hasError && hasValue,
    };
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onCerrar();
    }
  };

  if (!isModalOpen || !socio) return null;

  const setCampoValue = (campo, valor) => {
    setValue(`socios.${socioIndex}.${campo}`, valor, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className={styles.modalContainer}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.btnClose} onClick={onCerrar}>
          <FiX size={20} />
        </button>

        <form className={styles.body} onSubmit={(e) => {
          e.preventDefault();
          onGuardar();
        }}>
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
                value={valoresCampos.email || ""}
                onChange={(e) => setCampoValue("email", e.target.value)}
              />
              <InputFlotante
                label="Celular"
                maxLength={10}
                esValido={getCampo("celular").esValido}
                error={getCampo("celular").error}
                value={valoresCampos.celular || ""}
                onChange={(e) => {
                  const limpio = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setCampoValue("celular", limpio);
                }}
              />
            </div>

            <InputFlotante
              label="Dirección"
              esValido={getCampo("direccion").esValido}
              error={getCampo("direccion").error}
              value={valoresCampos.direccion || ""}
              onChange={(e) => setCampoValue("direccion", e.target.value)}
            />

            <div className={styles.inputRow}>
              <InputFlotante
                label="Provincia"
                esValido={getCampo("provincia").esValido}
                error={getCampo("provincia").error}
                value={valoresCampos.provincia || ""}
                onChange={(e) => setCampoValue("provincia", e.target.value)}
              />
              <InputFlotante
                label="Localidad"
                esValido={getCampo("localidad").esValido}
                error={getCampo("localidad").error}
                value={valoresCampos.localidad || ""}
                onChange={(e) => setCampoValue("localidad", e.target.value)}
              />
            </div>

            <h4 className={styles.sectionTitle}>2. Identidad (DNI)</h4>

            <div className={styles.dropzoneGrid}>
              <DropzoneField
                fileKey={`socio-${socioIndex}-frente`}
                title="DNI Frente"
                subtitle="Imagen clara y legible"
                intentoGuardarSocio={intentoGuardarSocio}
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
                intentoGuardarSocio={intentoGuardarSocio}
                archivos={archivos}
                draggingKey={draggingKey}
                onFileUpload={onFileUpload}
                onFileRemove={onFileRemove}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onCerrar}>
              CANCELAR
            </Button>
            <Button type="submit" variant="primary">
              GUARDAR DATOS
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

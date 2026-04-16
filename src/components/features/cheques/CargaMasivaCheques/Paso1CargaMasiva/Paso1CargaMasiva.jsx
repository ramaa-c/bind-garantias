import React from "react";
import { useDropzone } from "react-dropzone";
<<<<<<< HEAD:src/components/features/CargaMasivaCheques/Paso1CargaMasiva/Paso1CargaMasiva.jsx
import { CargaArchivos, Button } from "../../../ui";
=======
import { CargaArchivos, Button } from "../../../../ui";
>>>>>>> 3c4085b1b113aa88a92a7c139e5f9a3c41558b4f:src/components/features/cheques/CargaMasivaCheques/Paso1CargaMasiva/Paso1CargaMasiva.jsx
import styles from "./Paso1CargaMasiva.module.css";

export const Paso1CargaMasiva = ({
  archivoCargado,
  setArchivoCargado,
  onDescargarTemplate,
  onProcesarArchivo,
  isProcessing = false,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setArchivoCargado(acceptedFiles[0]);
      }
    },
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setArchivoCargado(null);
  };

  const handleContinuar = () => {
    if (archivoCargado) {
      onProcesarArchivo(archivoCargado);
    }
  };

  return (
    <div className={styles.pasoContainer}>
      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Descargar Template</h3>
        <p className={styles.seccionText}>
          El siguiente archivo debe ser descargado y rellenado con la
          información requerida.
        </p>

        <div className={styles.descargaBox}>
          <span className={styles.descargaLabel}>
            Template para carga masiva
          </span>
          <Button
            variant="outline"
            className={styles.btnDescargar}
            onClick={onDescargarTemplate}
            type="button"
          >
            DESCARGAR
          </Button>
        </div>
      </div>

      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Subir Template</h3>
        <p className={styles.seccionText}>
          El archivo deberá ser cargado aquí para ser procesado.
        </p>

        <div {...getRootProps()} className={styles.dropzoneWrapper}>
          <input {...getInputProps()} />
          <CargaArchivos
            title={isDragActive ? "¡Soltalo acá!" : "Arrastrá tu archivo acá"}
            subtitle="o hacé click para buscar (.xlsx, .csv)"
            isDragging={isDragActive}
            file={archivoCargado}
            onRemove={handleRemoveFile}
          />
        </div>

        {archivoCargado && (
          <div className={styles.actionFooter}>
            <Button
              variant="primary"
              onClick={handleContinuar}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando archivo..." : "Procesar y Continuar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
